'use strict';

const builder = (controllers, options) => {
    const router = new Router(options);
    const [ctls, actions] = [[require('./actions')], []];
    if (controllers) {
        fs.readdirSync(controllers).filter((file) => {
            return file.indexOf('.') !== 0;
        }).forEach(file => {
            const ctl = require(path.join(controllers, file));
            utilitas.assert(
                ctl && ctl.actions && Array.isArray(ctl.actions)
                && ctl.actions.length, `Invalid controller: ${file}.`, 500
            );
            ctls.push(ctl);
        });
    }
    ctls.map((ctl) => {
        if (ctl.disabled) { return; }
        ctl.actions.map((action) => {
            utilitas.assert(
                action && action.process,
                `Invalid action: ${JSON.stringify(action)}.`, 500
            );
            action.path = utilitas.ensureArray(action.path || '*');
            action.method = utilitas.ensureArray(action.method || 'ALL');
            action.process = utilitas.ensureArray(action.process);
            action.path.map((path) => {
                path = String(path || '').toLowerCase();
                action.method.map((method) => {
                    method = String(method || '').toLowerCase();
                    actions.push({
                        path, method,
                        process: action.process, priority: ~~action.priority,
                    });
                });
            });
        });
    });
    actions.sort((x, y) => { return x.priority - y.priority; });
    // console.log(actions);
    actions.map((action) => {
        action.process.unshift(action.path);
        router[action.method].apply(router, action.process);
    });
    return router;
};

module.exports = builder;

const { utilitas } = require('utilitas');
const Router = require('koa-router');
const path = require('path');
const fs = require('fs');

// const storage = require('./models/storage');
// const { ensureAuthorization } = require('./models/api');
// router.all('*', lib.api.errorHandler);
// const basename = path.basename(module.filename);
// router.all('*', lib.api.extendCtx);

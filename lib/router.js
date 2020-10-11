'use strict';

const log = (content) => { return utilitas.modLog(content, __filename); };

const builder = async (options) => {
    options = options || {};
    const router = new Router(options);
    const [ctls, actions] = [[subconscious], []];
    if (options.controllerPath) {
        await storage.assertPath(options.controllerPath, 'D', 'R');
        fs.readdirSync(options.controllerPath).filter((file) => {
            return file.indexOf('.') !== 0;
        }).forEach(file => {
            const ctl = require(path.join(options.controllerPath, file));
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
                action.method.map((method) => {
                    actions.push({
                        path: `/${String(path || '').toLowerCase()}`,
                        method: String(method || '').toLowerCase(),
                        process: utilitas.clone(action.process),
                        priority: ~~action.priority,
                        upload: !!action.upload,
                        auth: !!action.auth,
                    });
                });
            });
        });
    });
    actions.sort((x, y) => { return x.priority - y.priority; });
    actions.map((action) => { initAction(router, action); });
    return router;
};

const initAction = (router, action) => {
    const process = [];
    if (action.auth) { process.push(token.ensureAuthorization); }
    if (action.upload) {
        action.uploadIndex = process.push(libStorage.upload()) - 1;
    }
    action.process = [...process, ...action.process];
    router[action.method].apply(router, [action.path, ...action.process]);
    logAction(action);
};

const logAction = (action) => {
    const pcs = action.process.map((x) => { return x.name || 'anonymous' });
    if (action.upload) { pcs[action.uploadIndex] = 'upload'; }
    log(`${action.method.toUpperCase()} ${action.path} => ${pcs.join(', ')}`);
};

module.exports = builder;

const { utilitas, storage } = require('utilitas');
const subconscious = require('./subconscious');
const libStorage = require('./storage');
const Router = require('koa-router');
const token = require('./token');
const path = require('path');
const fs = require('fs');

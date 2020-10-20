'use strict';

const defaultControllerPath = '../controllers';

const log = (content) => { return utilitas.modLog(content, __filename); };

const builder = async (options) => {
    options = options || {};
    options.subconscious = options.subconscious || {};
    const router = new Router(options);
    const [arrPath, ctls, actions] = [[
        path.join(path.dirname(module.filename), defaultControllerPath),
        ...utilitas.ensureArray(options.controllerPath)
    ], [], []];
    for (let strPath of arrPath) {
        await storage.assertPath(strPath, 'D', 'R');
        fs.readdirSync(strPath).filter((file) => {
            return /\.js$/i.test(file) && file.indexOf('.') !== 0;
        }).forEach(file => {
            const ctl = require(path.join(strPath, file));
            const ctlLink = (ctl && ctl.link || '').toLowerCase();
            if (ctl
                && (ctlLink && !options[ctlLink] || ctl.disabled)) { return; }
            utilitas.assert(
                ctl && ctl.actions && Array.isArray(ctl.actions)
                && ctl.actions.length, `Invalid controller: ${file}.`, 500
            );
            ctls.push(ctl);
        });
    }
    ctls.map((ctl) => {
        ctl.actions.map((action) => {
            utilitas.assert(
                action && action.process,
                `Invalid action: ${JSON.stringify(action)}.`, 500
            );
            action.path = utilitas.ensureArray(action.path || '*');
            action.method = utilitas.ensureArray(action.method || 'GET');
            action.process = utilitas.ensureArray(action.process);
            action.path.map((path) => {
                action.method.map((method) => {
                    actions.push({
                        path: `/${String(path || '')}`,
                        method: String(method || '').toLowerCase(),
                        process: utilitas.clone(action.process),
                        priority: ~~action.priority,
                        upload: !!action.upload,
                        share: !!action.share,
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
    if (action.upload) { action.uploadIndex = process.push(file.upload()) - 1; }
    if (action.share) { process.push(file.share); }
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
const file = require('./file');
const Router = require('@koa/router');
const token = require('./token');
const path = require('path');
const fs = require('fs');

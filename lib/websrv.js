'use strict';

const httpPort = 8964;

const servePublicPath = (app, options) => {
    options = options || {};
    const arrPath = utilitas.ensureArray(options.publicPath
        || path.join(path.basename(module.filename), '../public'));
    arrPath.map((pubPath) => {
        storage.assertPath(pubPath, 'D', 'R');
        app.use(serve(pubPath));
    });
    return arrPath;
};

/**
 * @param {*} options
 *   prefix: '/api/v1'
 *   publicPath: ['absPathA', 'absPathB']
 */
const init = (options) => {
    options = options || {};
    global.websrv = { app: new Koa() };
    global.websrv.app.use(logger());
    global.websrv.app.use(bodyParser());
    global.websrv.app.use(json());
    global.websrv.app.use(cors());
    global.websrv.app.use(userAgent);
    servePublicPath(global.websrv.app, options);
    const [routerConfig, routeBuilder] = [{}, require('./routes')];
    if (options.prefix) { routerConfig.prefix = options.prefix; }
    const router = routeBuilder(options.controllers, routerConfig);
    global.websrv.app.use(router.routes()).use(router.allowedMethods());
    global.websrv.server = http.createServer(global.websrv.app.callback());
    return global.websrv;
};

const up = (options, callback) => {
    options = options || {};
    init(options);
    global.websrv.service = global.websrv.server.listen(
        options.port || httpPort, callback
    );
    return global.websrv;
};

const down = () => {
    global.websrv.service.close();
    return global.websrv;
};

module.exports = {
    init,
    up,
    down,
};

const { userAgent } = require('koa-useragent');
const { utilitas, storage } = require('utilitas');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const serve = require('koa-static');
const cors = require('@koa/cors');
const json = require('koa-json');
const path = require('path');
const http = require('http');
const Koa = require('koa');
// const fs = require('fs');
// const storage = require('./storage');

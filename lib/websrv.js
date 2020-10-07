'use strict';

const httpPort = 8964;

/**
 * @param {*} options
 *   prefix: '/api/v1'
 */
const init = (options) => {
    options = options || {};
    global.websrv = { app: new Koa() };
    global.websrv.app.use(logger());
    global.websrv.app.use(bodyParser());
    global.websrv.app.use(json());
    global.websrv.app.use(cors());
    global.websrv.app.use(userAgent);
    // // init static resources
    // app.use(serve(path.join(storage.pwd, 'public/web')));
    // app.use(serve(path.join(storage.pwd, 'public/avatars')));
    // app.use(serve(path.join(storage.pwd, 'public')));
    const routerConfig = {};
    if (options.prefix) { routerConfig.prefix = options.prefix; }
    const routeBuilder = require('./routes');
    const router = routeBuilder(options.controllers, routerConfig);
    global.websrv.app.use(router.routes()).use(router.allowedMethods());
    global.websrv.server = http.createServer(global.websrv.app.callback());
    process.on('uncaughtException', options.uncaught || require('./uncaught'));
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

// const path = require('path');
const http = require('http');
const Koa = require('koa');
const logger = require('koa-logger');
// const serve = require('koa-static');
const { userAgent } = require('koa-useragent');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const json = require('koa-json');
// const storage = require('./storage');

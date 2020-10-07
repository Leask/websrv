'use strict';

const httpPort = 8964;

const getPublicPath = (options) => {
    options = options || {};
    return utilitas.ensureArray(options.publicPath
        || path.join(path.basename(module.filename), '../public'));
};

/**
 * @param {*} options
 *   prefix: '/api/v1'
 *   publicPath: ['a', 'b']
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
    const [publicPath, routerConfig, routeBuilder]
        = [getPublicPath(options), {}, require('./routes')];
    publicPath.map((pubPath) => { global.websrv.app.use(serve(pubPath)); });
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
const { utilitas } = require('utilitas');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const serve = require('koa-static');
const cors = require('@koa/cors');
const json = require('koa-json');
const path = require('path');
const http = require('http');
const Koa = require('koa');
// const storage = require('./storage');

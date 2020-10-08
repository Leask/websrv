'use strict';

const httpPort = 8964;

/**
 * @param {*} options
 *   controllerPath: 'controllers',
 *   prefix: '/api/v1'
 *   publicPath: ['absPathA', 'absPathB']
 *   storagePath: 'absPathC'
 */
const init = async (options) => {
    options = options || {};
    global.websrv = {
        app: new Koa(),
        origin: options.origin || `http://localhost:${httpPort}`
    };
    global.websrv.app.use(logger());
    global.websrv.app.use(bodyParser());
    global.websrv.app.use(json());
    global.websrv.app.use(cors());
    global.websrv.app.use(userAgent);
    await storage.init(options);
    const router = await Router(options);
    global.websrv.app.use(router.routes()).use(router.allowedMethods());
    global.websrv.server = http.createServer(global.websrv.app.callback());
    return global.websrv;
};

const up = async (options, callback) => {
    options = options || {};
    await init(options);
    global.websrv.service = global.websrv.server.listen(
        options.port || httpPort, callback
    );
    console.log(`${(await utilitas.which(
    )).title} is running at ${global.websrv.origin}, ${new Date}.`);
    return global.websrv;
};

const down = () => {
    global.websrv.service.close();
    return global.websrv;
};

module.exports = {
    down,
    init,
    up,
};

const { userAgent } = require('koa-useragent');
const { utilitas } = require('utilitas');
const bodyParser = require('koa-bodyparser');
const storage = require('./storage');
const logger = require('koa-logger');
const Router = require('./router')
const cors = require('@koa/cors');
const json = require('koa-json');
const http = require('http');
const Koa = require('koa');

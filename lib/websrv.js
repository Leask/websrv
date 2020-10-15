'use strict';

const httpPort = 8964;

const log = (str, opts) => { return utilitas.modLog(str, __filename, opts); };

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
    global.websrv.app.use(logger((str, args) => { log(str, { time: true }); }));
    global.websrv.app.use(bodyParser());
    global.websrv.app.use(json());
    global.websrv.app.use(cors());
    global.websrv.app.use(userAgent);
    if (options.database) { db.init(options.database); }
    if (options.email) { await email.init(options.email); }
    await file.init(options);
    const router = await Router(options);
    global.websrv.app.use(router.routes()).use(router.allowedMethods());
    global.websrv.server = http.createServer(global.websrv.app.callback());
    await service.init(options);
    return global.websrv;
};

const up = async (options, callback) => {
    const start = process.hrtime();
    log(`${(await utilitas.which()).title} is launching...`, { time: true });
    options = options || {};
    await init(options);
    global.websrv.service = global.websrv.server.listen(
        options.port || httpPort, callback
    );
    const duration = Math.round(process.hrtime(start)[1] / 1000000 / 10) / 100;
    log(`Successfully launched at ${global.websrv.origin}`
        + ` within ${duration} seconds.`);
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

const { utilitas, db, email } = require('utilitas');
const { userAgent } = require('koa-useragent');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const service = require('./service');
const Router = require('./router')
const cors = require('@koa/cors');
const json = require('koa-json');
const file = require('./file');
const http = require('http');
const Koa = require('koa');

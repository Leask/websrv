'use strict';

const httpPort = 8080;

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
    global.debug = options.debug;
    global.websrv = { app: new Koa(), port: options.port || httpPort };
    websrv.listen = `http://localhost:${websrv.port}`;
    websrv.origin = options.origin || websrv.listen;
    websrv.app.use(logger((str, args) => {
        log(str.trim(), { time: true });
    }));
    websrv.app.use(bodyParser());
    websrv.app.use(json());
    websrv.app.use(cors());
    websrv.app.use(userAgent);
    if (options.database) { dbio.init(options.database); }
    if (options.email) { await email.init(options.email); }
    if (options.googleCloudCredentials) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS
            = options.googleCloudCredentials;
    }
    await file.init(options);
    const router = await Router(options);
    websrv.app.use(router.routes()).use(router.allowedMethods());
    websrv.server = http.createServer(websrv.app.callback());
    await service.init(options);
    return websrv;
};

const up = async (options, callback) => {
    options = options || {};
    const start = options.hrtime || process.hrtime();
    log(`${(await utilitas.which()).title} is launching...`, { time: true });
    await init(options);
    websrv.service = websrv.server.listen(websrv.port, callback);
    const duration = Math.round(process.hrtime(start)[1] / 1000000 / 10) / 100;
    log(`Listening at ${websrv.origin === websrv.listen ? ''
        : (colors.green(websrv.origin) + ' => ')}`
        + `${colors.green(websrv.listen)} .`);
    log(`Successfully launched within ${colors.yellow(duration)} seconds.`);
    return websrv;
};

const down = () => {
    websrv.service.close();
    return websrv;
};

module.exports = {
    down,
    init,
    up,
};

const { utilitas, dbio, email, colors } = require('utilitas');
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

'use strict';

const httpPort = 8080;

const log = (str, opts) => { return utilitas.modLog(str, __filename, opts); };

const configSession = async (options, app) => {
    options = options || {};
    // https://github.com/koajs/session
    const config = utilitas.mergeAtoB(options.config || {}, {
        key: `${(await utilitas.which()).name}.sess`, /** (string) cookie key (default is ${package.name}.sess) */
        /** (number || 'session') maxAge in ms (default is 1 days) */
        /** 'session' will result in a cookie that expires when session/browser is closed */
        /** Warning: If a session cookie is stolen, this cookie will never expire */
        maxAge: 86400000,
        autoCommit: true, /** (boolean) automatically commit headers (default true) */
        overwrite: true, /** (boolean) can overwrite or not (default true) */
        httpOnly: true, /** (boolean) httpOnly or not (default true) */
        signed: true, /** (boolean) signed or not (default true) */
        rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
        renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
        // secure: true, /** (boolean) secure cookie*/ // https://github.com/koajs/koa/issues/974
        sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
    });
    app.keys = utilitas.ensureArray(options.keys
        || encryption.digestObject(config));
    app.use(session(config, app));
};

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
    await configSession(options.session, websrv.app);
    websrv.app.proxy = websrv.origin !== websrv.listen;
    websrv.app.use(logger((str, args) => { log(str.trim(), { time: true }); }));
    websrv.app.use(bodyParser());
    websrv.app.use(json());
    websrv.app.use(cors());
    websrv.app.use(userAgent);
    if (options.database) { dbio.init(options.database); }
    if (options.email) { await email.init(options.email); }
    if (options.identity) { auth.init(options.identity, websrv.app); }
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
    log(`Listening at ${websrv.app.proxy ? `${colors.green(websrv.origin)} => `
        : ''}${colors.green(websrv.listen)} .`);
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

const { utilitas, dbio, email, colors, encryption } = require('utilitas');
const { userAgent } = require('koa-useragent');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const service = require('./service');
const logger = require('koa-logger');
const Router = require('./router')
const cors = require('@koa/cors');
const json = require('koa-json');
const auth = require('./identity');
const file = require('./file');
const http = require('http');
const Koa = require('koa');

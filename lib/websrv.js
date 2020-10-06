'use strict';

// const socketIo = require('socket.io');
// const redisAdapter = require('socket.io-redis');
// const userAgent = require('koa-useragent');
// const session = require('koa-session');
const path = require('path');
const http = require('http');
const Koa = require('koa');
const logger = require('koa-logger');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const json = require('koa-json');
const cors = require('@koa/cors');
// const storage = require('./storage');
const uncaught = require('./uncaught');
const buildRouter = require('../routes');

let init = (callback, options) => {
    options = options || {};
    // init koa
    global.websrv = { app: new Koa() };
    global.websrv.app.use(logger());
    global.websrv.app.use(bodyParser());
    global.websrv.app.use(json());
    global.websrv.app.use(cors());
    // // init session / https://github.com/koajs/session
    // global.websrv.use(userAgent);
    // global.websrv.app.keys = options.sessionKeys;
    // global.websrv.app.use(session(options.session, global.websrv.app));
    // // init static resources
    // app.use(serve(path.join(storage.pwd, 'public/web')));
    // app.use(serve(path.join(storage.pwd, 'public/avatars')));
    // app.use(serve(path.join(storage.pwd, 'public')));
    // buildRouter
    const routerConfig = {};
    options.prefix = '/api/v1';
    if (options.prefix) { routerConfig.prefix = options.prefix; }
    const router = buildRouter(routerConfig);
    //////////////////////////////////////////////////////////
    // global.websrv.app.use(router.routes()).use(router.allowedMethods());
    // init servers
    global.websrv.server = http.createServer(global.websrv.app.callback());
    //   global.io = socketIo(global.server);
    //   global.io.adapter(
    //     redisAdapter({
    //       pubClient: global.redis.duplicate(),
    //       subClient: global.redis.duplicate()
    //     })
    //   );
    return callback && callback();
};

let up = (callback, options) => {
    options = options || {};
    init(null, options);
    global.websrv.service = global.server.listen(
        options.port || 8964, callback// default config todo
    );
    //   global.models.socketIo.init();
};

let down = (callback) => {
    global.websrv.service.close();
    return callback && callback();
};

process.on('uncaughtException', uncaught);

module.exports = {
    init,
    up,
    down,
};

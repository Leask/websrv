'use strict';

const { utilitas, geoIp } = require('utilitas');

const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs').promises;

const [ptcHttp, ptcHttps] = ['http', 'https'];
const [wildcardPath, wildcardMethod] = [['*'], ['*']];

const analyze = async (ctx, next) => {
    ctx.originProtocol = ctx.socket.encrypted || (ctx.app.proxy
        && ctx.get('X-Forwarded-Proto').split(/\s*,\s*/)[0] === ptcHttps)
        ? ptcHttps : ptcHttp; // patch: https://github.com/koajs/koa/issues/974
    ctx.cookies.secure = ctx.encrypted = ctx.originProtocol === ptcHttps;
    ctx.userAgent._agent.versionNormalized
        = utilitas.parseVersion(ctx.userAgent.version);
    ctx.userAgent._agent.geoIp
        = ctx.request.ip ? await geoIp.lookup(ctx.request.ip) : null;
    await next();
};

const extendCtx = async (ctx, next) => {
    ctx.ok = (data) => {
        ctx.body = { data: data || {}, error: null, success: true };
    };
    ctx.er = (error, status) => {
        ctx.status = error && error.status || status || 400;
        ctx.body = {
            error: error && error.message
                || (typeof error === 'string' ? error : null)
                || httpStatus[`${ctx.status}_NAME`] || 'Unknown error.',
            details: error && error.details || {}, success: false,
        };
    };
    await next();
};

const errorHandler = async (ctx, next) => {
    try { await next(); } catch (err) {
        if (err.status
            && err.status >= httpStatus.BAD_REQUEST
            && err.status < httpStatus.INTERNAL_SERVER_ERROR) {
            return ctx.er(err);
        }
        throw err;
    }
};

const poke = async (ctx, next) => {
    ctx.ok({
        time: new Date(),
        userAgent: ctx.userAgent.source,
    });
};

const notFound = async (ctx, next) => {
    const status = 404;
    if (/^\/api\/.*/.test(ctx.request.url)) {
        return ctx.er({ error: 'API not found.' }, status);
    }
    ctx.body = await fs.readFile(path.join(
        path.dirname(module.filename), '../public/404.html'
    ), 'utf8');
    ctx.status = status;
};

module.exports = {
    link: 'subconscious',
    disabled: false,
    actions: [
        {
            path: wildcardPath,
            method: wildcardMethod,
            priority: -8960,
            process: [analyze, errorHandler, extendCtx],
            auth: false,
            upload: false,
            share: false,
        },
        {
            path: ['api/poke'],
            method: wildcardMethod,
            priority: -8940,
            process: [poke],
            auth: false,
            upload: false,
            share: false,
        },
        {
            path: wildcardPath,
            method: wildcardMethod,
            priority: 8960,
            process: [notFound],
            auth: false,
            upload: false,
            share: false,
        },
    ],
};

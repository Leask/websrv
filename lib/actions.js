'use strict';

const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');

const [wildcardPath, wildcardMethod] = [['(.*)'], ['ALL']];

const extendCtx = async (ctx, next) => {
    ctx.ok = (data) => {
        ctx.body = { errors: null, data: data, success: true };
    };
    ctx.er = (error, code) => {
        ctx.status = code || 400;
        ctx.body = { error: error && error.error || error, success: false };
    };
    ctx.throws = (err) => {
        ctx.status = err.status || 400;
        ctx.body = {
            error: err.message || httpStatus[`${ctx.status}_NAME`],
            details: err.errors || {},
        };
    };
    await next();
};

const errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        if (err.status
            && err.status >= httpStatus.BAD_REQUEST
            && err.status < httpStatus.INTERNAL_SERVER_ERROR) {
            ctx.throws(err);
            return;
        }
        throw err;
    }
};

const status = async (ctx, next) => {
    // ctx.userAgent
    ctx.body = 'OK';
};

const notFound = (ctx, next) => {
    return new Promise((resolve, reject) => {
        const status = 404;
        if (/^\/api\/.*/.test(ctx.request.url)) {
            ctx.er({ error: 'API not found.' }, status);
            return resolve();
        }
        fs.readFile(path.join(
            path.basename(module.filename), '../public/404.html'
        ), 'utf8', (err, resp) => {
            if (err) { return reject(err); }
            ctx.body = resp;
            ctx.status = status;
            resolve();
        });
    });
};

module.exports = {
    disabled: false,
    actions: [
        {
            path: wildcardPath,
            method: wildcardMethod,
            priority: -8964,
            process: [errorHandler],
        },
        {
            path: wildcardPath,
            method: wildcardMethod,
            priority: -8954,
            process: [extendCtx],
        },
        {
            path: ['status'],
            method: ['GET'],
            priority: -8944,
            process: [status],
        },
        {
            path: wildcardPath,
            method: wildcardMethod,
            priority: 8964,
            process: [notFound],
        },
    ],
};

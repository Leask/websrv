'use strict';

const path = require('path');
const fs = require('fs');

const status = async (ctx, next) => {
    ctx.body = 'OK';
};

const notFound = (ctx, next) => {
    return new Promise((resolve, reject) => {
        if (/^\/api\/.*/.test(ctx.request.url)) {
            ctx.er({ error: 'API not found.' }, 404);
            return resolve();
        }
        fs.readFile(path.join(
            path.basename(module.filename), '../public/404.html'
        ), 'utf8', (err, resp) => {
            if (err) { return reject(err); }
            ctx.body = resp;
            resolve();
        });
    });
};

module.exports = {
    disabled: false,
    actions: [
        {
            path: ['status'],
            method: ['GET'],
            priority: -8964,
            process: [status],
        },
        {
            path: ['(.*)'],
            method: ['ALL'],
            priority: 8964,
            process: [notFound],
        },
    ],
};

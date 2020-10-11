'use strict';

const { db } = require('utilitas');

const test = async (ctx, next) => {
    // console.log(ctx.req.fileSlots);
    // console.log(ctx.req);
    // const resp = await db.warm().query('SELECT * FROM `users`');
    // console.log(resp.rows);

    // const resp = await db.queryById('users', 'xasasasdfdaasd2ewfasdfasdffasdfasadfsdasdasdfaasdffsdfxxx');

    // const resp = await db.queryByKeyAndValue('users', 'id', 'xxxx');

    console.log(ctx.req);

    ctx.body = 'OK';
    // try {
    //     const resp = await lib.sushitrain.getInfo();
    //     ctx.ok(resp);
    // } catch (err) {
    //     ctx.er(err.message);
    // }
};

// console.log(global.websrv.upload);
// console.log(require('../lib/storage'));

module.exports = {
    disabled: false,
    actions: [
        {
            path: ['test'],
            method: ['GET', 'POST'],
            priority: 0,
            process: [test],
            auth: true,
            upload: true,
        },
    ],
};

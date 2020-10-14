'use strict';

const { file } = require('../');

const test = async (ctx, next) => {
    // console.log(ctx.req.fileSlots);
    // console.log(ctx.req);
    // const resp = await db.warm().query('SELECT * FROM `users`');
    // console.log(resp.rows);

    // const resp = await db.queryById('users', 'xasasasdfdaasd2ewfasdfasdffasdfasadfsdasdasdfaasdffsdfxxx');

    // const resp = await db.queryByKeyAndValue('users', 'id', 'xxxx');

    console.log(ctx.req.files);;

    ctx.body = 'OK';
    // try {
    //     const resp = await lib.sushitrain.getInfo();
    //     ctx.ok(resp);
    // } catch (err) {
    //     ctx.er(err.message);
    // }
};


const test2 = async (ctx, next) => {
    // console.log(ctx.req.fileSlots);
    // console.log(ctx.req);
    // const resp = await db.warm().query('SELECT * FROM `users`');
    // console.log(resp.rows);

    // const resp = await db.queryById('users', 'xasasasdfdaasd2ewfasdfasdffasdfasadfsdasdasdfaasdffsdfxxx');

    // const resp = await db.queryByKeyAndValue('users', 'id', 'xxxx');

    console.log(ctx.req.files);;

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
            auth: false,
            upload: true,
            share: true,
        },
        // {
        //     path: ['test2'],
        //     method: ['GET', 'POST'],
        //     priority: 0,
        //     process: [file.organize, test],
        //     auth: false,
        //     share: true,
        // },
    ],
};

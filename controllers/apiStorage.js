'use strict';

const storage = async (ctx, next) => {
    const resp = {};
    ctx.req.files.map((file) => {
        resp[file.fieldname || file.originalname] = file.receipt;
    });
    ctx.ok(resp);
};

module.exports = {
    name: 'storage',
    actions: [
        {
            path: 'api/storage',
            method: 'POST',
            process: storage,
            auth: true,
            upload: true,
            share: true,
        },
    ],
};

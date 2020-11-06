'use strict';

const wrap = async (ctx, next) => {
    const resp = {};
    ctx.request.files.map((file) => {
        resp[file.fieldname || file.originalname] = file.receipt;
    });
    ctx.ok(resp);
};

module.exports = {
    link: 'file',
    actions: [
        {
            path: 'api/files',
            method: 'POST',
            process: wrap,
            auth: true,
            upload: true,
            share: true,
        },
    ],
};

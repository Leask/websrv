'use strict';

const { websrv } = require('.');

(async () => {
    await websrv.up({
        user: {},
        storage: {},
    });
})();

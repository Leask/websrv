'use strict';

const { websrv } = require('.');

(async () => {
    await websrv.up({ modules: ['user', 'storage'] });
})();

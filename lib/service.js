'use strict';

const defaultServicePath = '../services';

const link = new Set();

const checkLink = (key) => { return link.has(key); };

const init = (options) => {
    options = options || {};
    Object.keys(options).map((key) => { link.add(key); });
    utilitas.ensureArray(options.servicePath || path.join(
        path.dirname(module.filename), defaultServicePath
    )).map(event.bulk);
};

module.exports = {
    init,
    checkLink,
};

const { utilitas, event } = require('utilitas');
const path = require('path');

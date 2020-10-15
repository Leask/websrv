'use strict';

const defaultServicePath = '../services';

const init = (options) => {
    options = options || {};
    utilitas.ensureArray(options.servicePath || path.join(
        path.dirname(module.filename), defaultServicePath
    )).map(event.bulk);
};

module.exports = {
    init,
};

const { utilitas, event } = require('utilitas');
const path = require('path');

'use strict';

const defaultServicePath = '../services';
const link = new Set();
const checkLink = (key) => { return link.has(key); };

let event;

const init = async (options) => {
    if (options) {
        event = require('utilitas').event;
        Object.keys(options).map((key) => { link.add(key); });
        utilitas.ensureArray(options.servicePath || path.join(
            path.dirname(module.filename), defaultServicePath
        )).map(event.bulk);
    }
    utilitas.assert(event, 'Services have not been initialized.', 501);
    return event;
};

const end = async (options) => {
    return event && await event.end(options);
};

module.exports = {
    init,
    checkLink,
    end,
};

const { utilitas } = require('utilitas');
const path = require('path');

'use strict';

const { utilitas } = require('utilitas');
const service = require('../lib/service');
const token = require('../lib/token');

const log = (content) => { return utilitas.modLog(content, __filename); };

const action = async () => {
    const resp = await token.cleanup();
    log(`${resp && resp.affectedRows || 0} expired tokens have been cleared.`);
};

module.exports = {
    run: service.checkLink('user'),
    func: action,
    interval: 60,
    tout: 60,
    delay: 0,
};

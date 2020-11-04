'use strict';

const { thirdParty } = require('../');

module.exports = {
    link: 'thirdparties',
    actions: [
        {
            path: thirdParty.getUrls(thirdParty.sTwitter),
            method: 'GET',
            process: thirdParty.authenticate(thirdParty.sTwitter),
        },
    ],
};

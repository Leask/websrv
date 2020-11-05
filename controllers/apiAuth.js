'use strict';

const { auth } = require('..');

const getUrls = (prdr, options) => {
    return [auth.getAuthUrl(prdr, options), auth.getCallbackUrl(prdr, options)];
};

module.exports = {
    link: 'auth',
    actions: [
        {
            path: getUrls(auth.sTwitter),
            method: 'GET',
            process: auth.authenticate(auth.sTwitter),
        },
    ],
};

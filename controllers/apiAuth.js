'use strict';

const { auth } = require('..');

const getUrls = (prdr, options) => {
    return [auth.getAuthUrl(prdr, options), auth.getCallbackUrl(prdr, options)];
};

const authCallback = async (ctx, next) => {
    ctx.redirect(`${auth.successRedirect}?token=${ctx.req.user.token.id}`);
};

module.exports = {
    link: 'auth',
    actions: [
        {
            path: getUrls(auth.sTwitter),
            method: 'GET',
            process: [auth.authenticate(auth.sTwitter), authCallback],
        },
    ],
};

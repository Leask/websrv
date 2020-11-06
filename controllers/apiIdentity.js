'use strict';

const { identity } = require('..');

const getUrls = (prdr, opt) => {
    return [identity.getAuthUrl(prdr, opt), identity.getCallbackUrl(prdr, opt)];
};

const authCallback = async (ctx, next) => {
    ctx.redirect(`${identity.successRedirect}?token=${ctx.req.user.token.id}`);
};

module.exports = {
    link: 'identity',
    actions: [
        {
            path: getUrls(identity.sTwitter),
            method: 'GET',
            process: [identity.authenticate(identity.sTwitter), authCallback],
        },
    ],
};

'use strict';

const successRedirect = '/home';
const failureRedirect = '/signin';
const wthOgn = { withOrigin: true };
const log = (content) => { return utilitas.modLog(content, __filename); };

const [sDefault, sTwitter, sFacebook, sGoogle] =
    ['passport', 'twitter', 'facebook', 'google'];

const strategies = {
    [sDefault]: { pkg: 'passport', stg: null, m: null },
    [sTwitter]: { pkg: 'passport-twitter', stg: 'Strategy', m: null },
    [sFacebook]: { pkg: 'passport-facebook', stg: 'Strategy', m: null },
    [sGoogle]: { pkg: 'passport-google-oauth', stg: 'OAuth2Strategy', m: null },
};

const initStrategy = {
    [sTwitter]: (opt) => {
        opt = opt || {};
        utilitas.assert(opt.consumerKey, 'Twitter Key is required.', 400);
        utilitas.assert(opt.consumerSecret, 'Twitter Secret is required.', 400);
        opt.callbackURL = opt.callbackURL || getCallbackUrl(sTwitter, wthOgn);
        getPassport().use(new (getPassport(sTwitter))(opt,
            function(token, tokenSecret, profile, done) {
                console.log(token, tokenSecret, profile);
                done(null, { OK: 'OK' });
            }
        ));
    },
};

const assertProvider = (prvdr) => {
    prvdr = utilitas.trim(prvdr, { case: 'LOW' });
    utilitas.assert(strategies[prvdr], `Invalid strategy: '${prvdr}'.`, 400);
    return prvdr;
};

const getPassport = (provider = sDefault) => {
    if (!strategies[provider = assertProvider(provider)].m) {
        const load = require(strategies[provider].pkg);
        strategies[provider].m = strategies[provider].stg
            ? load[strategies[provider].stg] : load;
        utilitas.assert(strategies[provider].m,
            `Error loading passport strategy: '${provider}'.`, 500);
        log(`Initialized: ${provider}.`);
    }
    return strategies[provider].m;
};

const getApiRoot = (options) => {
    options = options || {};
    return `${options.withOrigin ? `${websrv.origin}/` : ''}api/thirdparties/`;
};

const getAuthUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/auth`;
};

const getCallbackUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/callback`;
};

const getUrls = (provider, options) => {
    return [getAuthUrl(provider, options), getCallbackUrl(provider, options)];
};

const authenticate = (provider) => {
    const defStrategy = strategies[sDefault].m;
    utilitas.assert(defStrategy, 'Passport has not been initialized.', 501);
    return getPassport().authenticate(assertProvider(provider), {
        successRedirect, failureRedirect,
    });
};

const init = (options) => {
    options = options || {};
    for (let provider in strategies) {
        if (options[provider]) { initStrategy[provider](options[provider]); }
    }
};

module.exports = {
    sFacebook,
    sGoogle,
    sTwitter,
    assertProvider,
    authenticate,
    getUrls,
    getPassport,
    init,
};

const { utilitas } = require('utilitas');

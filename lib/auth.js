'use strict';

const successRedirect = '/home';
const failureRedirect = '/signin';
const wthOgn = { withOrigin: true };
const log = (content) => { return utilitas.modLog(content, __filename); };

const [sDefault, sTwitter, sFacebook, sGoogle] =
    ['passport', 'twitter', 'facebook', 'google'];

const strategies = {
    [sDefault]: { pkg: 'koa-passport', stg: null, mdl: null },
    [sTwitter]: { pkg: 'passport-twitter', stg: 'Strategy', mdl: null },
    [sFacebook]: { pkg: 'passport-facebook', stg: 'Strategy', mdl: null },
    [sGoogle]: { pkg: 'passport-google-oauth20', stg: 'Strategy', mdl: null },
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
    if (!strategies[provider = assertProvider(provider)].mdl) {
        const load = require(strategies[provider].pkg);
        strategies[provider].mdl = strategies[provider].stg
            ? load[strategies[provider].stg] : load;
        utilitas.assert(strategies[provider].mdl,
            `Error loading passport strategy: '${provider}'.`, 500);
        log(`Initialized: ${provider}.`);
    }
    return strategies[provider].mdl;
};

const getApiRoot = (opts) => {
    return `${opts && opts.withOrigin ? `${websrv.origin}/` : ''}api/auth/`;
};

const getAuthUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/signin`;
};

const getCallbackUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/callback`;
};

const authenticate = (prvdr) => {
    return strategies[sDefault].mdl && getPassport(
    ).authenticate(assertProvider(prvdr), { successRedirect, failureRedirect });
};

const init = (options, app) => {
    options = options || {};
    for (let provider in strategies) {
        if (options[provider]) { initStrategy[provider](options[provider]); }
    }
    getPassport().serializeUser((obj, callback) => { callback(null, obj); });
    getPassport().deserializeUser((obj, callback) => { callback(null, obj); });
    app.use(getPassport().initialize());
    app.use(getPassport().session());
};

module.exports = {
    sFacebook,
    sGoogle,
    sTwitter,
    assertProvider,
    authenticate,
    getAuthUrl,
    getCallbackUrl,
    getPassport,
    init,
};

const { utilitas } = require('utilitas');

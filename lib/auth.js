'use strict';

const authOptions = { successRedirect: '/home', failureRedirect: '/signin' };
const wthOgn = { withOrigin: true };
const log = (content) => { return utilitas.modLog(content, __filename); };

const [sDefault, sTwitter, sFacebook, sGoogle] =
    ['passport', 'twitter', 'facebook', 'google'];

const strategies = {
    [sDefault]: { package: 'koa-passport' },
    [sTwitter]: { package: 'passport-twitter', strategy: 'Strategy' },
    [sFacebook]: { package: 'passport-facebook', strategy: 'Strategy' },
    [sGoogle]: { package: 'passport-google-oauth20', strategy: 'Strategy' },
};

const initStrategy = {
    [sTwitter]: (opt) => {
        opt = opt || {};
        utilitas.assert(opt.consumerKey, 'Twitter Key is required.', 400);
        utilitas.assert(opt.consumerSecret, 'Twitter Secret is required.', 400);
        utilitas.isUndefined(opt.includeEmail) && (opt.includeEmail = true);
        opt.callbackURL = opt.callbackURL || getCallbackUrl(sTwitter, wthOgn);
        getPassport().use(new (getPassport(sTwitter))(opt,
            (token, tokenSecret, profile, done) => {
                console.log(token, tokenSecret, profile);
                done(null, { OK: 'OK' });
            }
        ));
        strategies[sTwitter].options = opt.options || authOptions;
    },
};

const assertProvider = (prvdr) => {
    prvdr = utilitas.trim(prvdr, { case: 'LOW' });
    utilitas.assert(strategies[prvdr], `Invalid strategy: '${prvdr}'.`, 400);
    return prvdr;
};

const getPassport = (provider = sDefault) => {
    if (!strategies[provider = assertProvider(provider)].module) {
        const load = require(strategies[provider].package);
        strategies[provider].module = strategies[provider].strategy
            ? load[strategies[provider].strategy] : load;
        utilitas.assert(strategies[provider].module,
            `Error loading passport strategy: '${provider}'.`, 500);
        log(`Initialized: ${provider}.`);
    }
    return strategies[provider].module;
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
    return strategies[sDefault].module && getPassport(
    ).authenticate(assertProvider(prvdr), strategies[prvdr].options);
};

// const


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

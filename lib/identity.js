'use strict';

const successRedirect = '/home';           // Remove successRedirect if you want
const failureRedirect = '/signin?error=authfailed';     // to run custom routes.
const authOptions = { /* successRedirect, */ failureRedirect };
const userOptions = { asPlain: true, ignore404: true };
const wthOgn = { withOrigin: true };
const table = 'identities';
const log = (content) => { return utilitas.modLog(content, __filename); };

const [sDefault, sTwitter, sFacebook, sGoogle]
    = ['passport', 'twitter', 'facebook', 'google'];

const commonFields = [
    'id', 'userId', 'provider', 'account', 'username', 'fullName',
    'email', 'avatar', 'bio', 'createdAt', 'updatedAt'
];

const strategies = {
    [sDefault]: { package: 'koa-passport' },
    [sTwitter]: { package: 'passport-twitter', strategy: 'Strategy' },
    // [sFacebook]: { package: 'passport-facebook', strategy: 'Strategy' },
    // [sGoogle]: { package: 'passport-google-oauth20', strategy: 'Strategy' },
};

const newId = (provider, id) => {
    return uoid.create({ file: __filename, id: `${id}@${provider}` });
};

const queryById = async (id, options) => {
    options = options || {};
    options.fields || (options.fields = commonFields);
    return await dbio.queryById(table, id, options);
};

const upsertIdentity = async (identity, options) => {
    let { sql, values } = dbio.assembleInsert(table, identity);
    const id = identity.id;
    delete identity.id;
    delete identity.createdAt;
    const { sql: updSql, values: updValues } = dbio.assembleSet(identity);
    sql += ` ON DUPLICATE KEY UPDATE${updSql.replace(/^SET/, '')}`;
    await dbio.execute(sql, [...values, ...updValues]);
    const resp = await queryById(id, options);
    utilitas.assert(resp, 'Error updating identity.', 500);
    return resp;
};

const updateById = async (id, data, options) => {
    options = options || {};
    options.fields || (options.fields = commonFields);
    data = data || {};
    data.updatedAt = new Date();
    return await dbio.updateById(table, id, data, options);
};

const linkUser = async (identityId, userId, options) => {
    return await updateById(identityId, { userId }, options);
};

const handleCallback = (rawIdentity, callback) => {
    (async () => {
        let identity = await upsertIdentity(rawIdentity);
        let cUser = null;
        if (identity.userId || identity.email) {
            const idOrEmail = identity.userId || identity.email;
            cUser = await user.queryByIdOrEmail(idOrEmail, userOptions);
        }
        if (!cUser) {
            const nck = await user.queryByName(identity.username, userOptions);
            const name = identity.username
                + (nck ? `.${encryption.randomString(4)}` : '');
            const nUser = Object.assign({ name }, identity);
            cUser = await user.create(nUser, { mode: 'AUTH', asPlain: true });
        }
        if (!identity.userId) {
            identity = await linkUser(identity.id, cUser.id);
        }
        const resp = Object.assign({ identity }, await user.rawSignin(cUser));
        callback(null, resp);
    })();
};

const initStrategy = {
    [sTwitter]: (opt) => {
        opt = opt || {};
        utilitas.assert(opt.consumerKey, 'Twitter Key is required.', 400);
        utilitas.assert(opt.consumerSecret, 'Twitter Secret is required.', 400);
        utilitas.isUndefined(opt.includeEmail) && (opt.includeEmail = true);
        opt.callbackURL = opt.callbackURL || getCallbackUrl(sTwitter, wthOgn);
        console.log(opt.callbackURL);
        getPassport().use(new (getPassport(sTwitter))(opt,
            (token, tokenSecret, profile, callback) => {
                const createdAt = new Date();
                handleCallback({
                    id: newId(sTwitter, profile.id),
                    provider: sTwitter,
                    account: profile.id,
                    username: profile.username || null,
                    fullName: profile.displayName || null,
                    email: profile._json.email || null,
                    avatar: profile.photos && profile.photos.length
                        ? profile.photos[0].value : null,
                    bio: profile._json.description || null,
                    profile: profile._raw,
                    keys: JSON.stringify({ token, tokenSecret, createdAt }),
                    createdAt,
                    updatedAt: createdAt,
                }, callback);
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

const getApiRoot = (opt) => {
    return `${opt && opt.withOrigin ? `${websrv.origin}/` : ''}api/identities/`;
};

const getAuthUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/signin`;
};

const getCallbackUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/callback`;
};

const authenticate = (provider) => {
    return strategies[sDefault].module && getPassport(
    ).authenticate(assertProvider(provider), strategies[provider].options);
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
    successRedirect,
    assertProvider,
    authenticate,
    getAuthUrl,
    getCallbackUrl,
    getPassport,
    init,
};

const { utilitas, dbio, encryption, uoid } = require('utilitas');
const user = require('./user');

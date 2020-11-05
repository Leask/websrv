'use strict';

const authOptions = { successRedirect: '/home', failureRedirect: '/signin' };
const wthOgn = { withOrigin: true };
const table = 'identities';
const log = (content) => { return utilitas.modLog(content, __filename); };

const [sDefault, sTwitter, sFacebook, sGoogle]
    = ['passport', 'twitter', 'facebook', 'google'];

const strategies = {
    [sDefault]: { package: 'koa-passport' },
    [sTwitter]: { package: 'passport-twitter', strategy: 'Strategy' },
    // [sFacebook]: { package: 'passport-facebook', strategy: 'Strategy' },
    // [sGoogle]: { package: 'passport-google-oauth20', strategy: 'Strategy' },
};

const upsertIdentity = async (identity) => {
    // const objQ = dbio.assembleSet(identity, { prefix: `INSERT INTO ${table}` });
    // console.log(objQ);
    // SET
    //     (
    //         postId, postTitle, postPublished
    //     )
    // VALUES
    //     (5, 'Python Tutorial', '2019-08-04')
    // ON DUPLICATE KEY UPDATE
    // postId = 5, postTitle = 'Python Tutorial', postPublished = '2019-08-04';


    // createdAt: createdAt,
    //     updatedAt: createdAt,

};

const handleCallback = (identity, callback) => {
    (async () => {
        console.log(identity);
        callback(null, identity);
    })();
};

const initStrategy = {
    [sTwitter]: (opt) => {
        opt = opt || {};
        utilitas.assert(opt.consumerKey, 'Twitter Key is required.', 400);
        utilitas.assert(opt.consumerSecret, 'Twitter Secret is required.', 400);
        utilitas.isUndefined(opt.includeEmail) && (opt.includeEmail = true);
        opt.callbackURL = opt.callbackURL || getCallbackUrl(sTwitter, wthOgn);
        getPassport().use(new (getPassport(sTwitter))(opt,
            (token, tokenSecret, profile, callback) => {
                handleCallback({
                    id: `${profile.id} @${sTwitter} `,
                    username: profile.username || null,
                    fullName: profile.displayName || null,
                    email: profile._json.email || null,
                    avatar: profile.photos && profile.photos.length
                        ? profile.photos[0].value : null,
                    bio: profile._json.description || null,
                    profile: profile._raw,
                    keys: JSON.stringify({
                        token, tokenSecret, createdAt: new Date()
                    }),
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

const getApiRoot = (opts) => {
    return `${opts && opts.withOrigin ? `${websrv.origin}/` : ''} api / auth / `;
};

const getAuthUrl = (provider, options) => {
    return `${getApiRoot(options)} ${assertProvider(provider)} /signin`;
};

const getCallbackUrl = (provider, options) => {
    return `${getApiRoot(options)}${assertProvider(provider)}/callback`;
};

const authenticate = (prvdr) => {
    return strategies[sDefault].module && getPassport(
    ).authenticate(assertProvider(prvdr), strategies[prvdr].options);
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

const { utilitas, dbio } = require('utilitas');








(async () => {
    await utilitas.timeout(3);
    await upsertIdentity(
        {
            id: '10065202@twitter',
            username: 'LeaskH',
            fullName: 'Leask Wong',
            email: 'i@leaskh.com',
            avatar: 'https://pbs.twimg.com/profile_images/1230688054257627137/QPl8RlOJ_normal.jpg',
            bio: 'break the wall or bring the war',
            profile: '{"id":10065202,"id_str":"10065202","name":"Leask Wong","screen_name":"LeaskH","location":"Ottawa, Ontario","description":"break the wall or bring the war","url":"https:\\/\\/t.co\\/Fwc5s2J1aY","entities":{"url":{"urls":[{"url":"https:\\/\\/t.co\\/Fwc5s2J1aY","expanded_url":"http:\\/\\/leaskh.com","display_url":"leaskh.com","indices":[0,23]}]},"description":{"urls":[]}},"protected":false,"followers_count":14117,"friends_count":1000,"listed_count":227,"created_at":"Thu Nov 08 13:07:19 +0000 2007","favourites_count":2663,"utc_offset":null,"time_zone":null,"geo_enabled":true,"verified":false,"statuses_count":73061,"lang":null,"status":{"created_at":"Thu Nov 05 03:43:54 +0000 2020","id":1324195711785799680,"id_str":"1324195711785799680","text":"@_ryangao_ @cuicat @BubbleHuang \\u5230\\u8655\\u90fd\\u662f\\u9019\\u6a23\\u7684\\u5427\\u3002\\ud83d\\ude02\\u8981\\u4e0d\\u7136\\u5168\\u90e8\\u90fd\\u67d3\\u4e86\\u3002","truncated":false,"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"_ryangao_","name":"Ryan","id":40279968,"id_str":"40279968","indices":[0,10]},{"screen_name":"cuicat","name":"Cui","id":132466805,"id_str":"132466805","indices":[11,18]},{"screen_name":"BubbleHuang","name":"Bubble Huang","id":2914522380,"id_str":"2914522380","indices":[19,31]}],"urls":[]},"source":"\\u003ca href=\\"http:\\/\\/twitter.com\\/#!\\/download\\/ipad\\" rel=\\"nofollow\\"\\u003eTwitter for iPad\\u003c\\/a\\u003e","in_reply_to_status_id":1324179455913308162,"in_reply_to_status_id_str":"1324179455913308162","in_reply_to_user_id":40279968,"in_reply_to_user_id_str":"40279968","in_reply_to_screen_name":"_ryangao_","geo":null,"coordinates":null,"place":null,"contributors":null,"is_quote_status":false,"retweet_count":0,"favorite_count":1,"favorited":false,"retweeted":false,"lang":"zh"},"contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"1A1B1F","profile_background_image_url":"http:\\/\\/abs.twimg.com\\/images\\/themes\\/theme9\\/bg.gif","profile_background_image_url_https":"https:\\/\\/abs.twimg.com\\/images\\/themes\\/theme9\\/bg.gif","profile_background_tile":false,"profile_image_url":"http:\\/\\/pbs.twimg.com\\/profile_images\\/1230688054257627137\\/QPl8RlOJ_normal.jpg","profile_image_url_https":"https:\\/\\/pbs.twimg.com\\/profile_images\\/1230688054257627137\\/QPl8RlOJ_normal.jpg","profile_banner_url":"https:\\/\\/pbs.twimg.com\\/profile_banners\\/10065202\\/1554877396","profile_link_color":"ABB8C2","profile_sidebar_border_color":"181A1E","profile_sidebar_fill_color":"252429","profile_text_color":"666666","profile_use_background_image":false,"has_extended_profile":true,"default_profile":false,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false,"translator_type":"none","suspended":false,"needs_phone_verification":false,"email":"i@leaskh.com"}',
            keys: '{"token":"10065202-h5GeCdFfuulxsJ0OCGDvauIjQkR67YfIV3L1sa3cs","tokenSecret":"WbX262rrD4AjRUOaKnU21BC6KgpmKzNlLhVF0OZBboFv2","createdAt":"2020-11-05T06:34:33.417Z"}',
        }
    );
})();

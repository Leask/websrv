'use strict';

const { user, token } = require('../');
const path = require('path');

const getPath = (subPath) => { return path.join('api/users', subPath); };

const verifyToken = async (ctx, next) => {
    const t = ctx.request.headers.token || ctx.query.token;
    // Use ctx.req instead of ctx to ensure compatibility to multer if you need.
    try { ctx.verification = await token.verifyForUser(t); } catch (err) { }
    await next();
};

const resolveToken = async (ctx, next) => {
    ctx.ok(ctx.verification);
};

const signup = async (ctx, next) => {
    ctx.ok(await user.signup(ctx.request.body));
};

const signin = async (ctx, next) => {
    ctx.ok(await user.signin(ctx.request.body.email,
        ctx.request.body.password));
};

const getMyProfile = async (ctx, next) => {
    ctx.ok(ctx.verification.user);
};

const queryById = async (ctx, next) => {
    ctx.ok(await user.queryByIdOrEmail(ctx.params.id));
};

const updateProfile = async (ctx, next) => {
    ctx.ok(await user.updateById(ctx.verification.user.id,
        ctx.request.body, { curUser: ctx.verification.user }));
};

const emailVerificationRequest = async (ctx, next) => {
    await user.sendVerificationEmail(
        ctx.verification.user.email, { user: ctx.verification.user }
    );
    ctx.ok();
};

const emailVerificationResponse = async (ctx, next) => {
    ctx.ok(await user.verifyEmail(ctx.request.body.token));
};

const passwordRecoveryRequest = async (ctx, next) => {
    await user.sendPasswordRecoveryEmail(ctx.request.body.email);
    ctx.ok();
};

const changePassword = async (ctx, next) => {
    let resp = null;
    if (ctx.request.body.token) {
        resp = await user.changePasswordByVerificationToken(
            ctx.request.body.token, ctx.request.body.newPassword
        );
    } else if (ctx.request.body.email) {
        resp = await user.changePasswordByEmailAndPassword(
            ctx.request.body.email,
            ctx.request.body.curPassword,
            ctx.request.body.newPassword
        );
    } else { throw Object.assign(new Error(), { status: 400 }); }
    ctx.ok(resp);
};

module.exports = {
    link: 'user',
    actions: [
        {
            path: '(.*)',
            method: 'ALL',
            priority: -8950,
            process: verifyToken,
        },
        {
            path: 'api/tokens',
            method: 'GET',
            process: resolveToken,
            auth: true,
        },
        {
            path: getPath('signup'),
            method: 'POST',
            process: signup,
        },
        {
            path: getPath('signin'),
            method: 'POST',
            process: signin,
        },
        {
            path: getPath('me'),
            method: 'GET',
            process: getMyProfile,
            auth: true,
        },
        {
            path: getPath(':id'),
            method: 'GET',
            process: queryById,
        },
        {
            path: getPath('me'),
            method: 'POST',
            process: updateProfile,
            auth: true,
        },
        {
            path: getPath('email/challenge'),
            method: 'POST',
            process: emailVerificationRequest,
            auth: true,
        },
        {
            path: getPath('email/response'),
            method: 'POST',
            process: emailVerificationResponse,
        },
        {
            path: getPath('password/recover'),
            method: 'POST',
            process: passwordRecoveryRequest,
        },
        {
            path: getPath('password/change'),
            method: 'POST',
            process: changePassword,
        },
    ],
};

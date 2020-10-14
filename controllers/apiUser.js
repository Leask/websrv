'use strict';

const { user } = require('../');
const path = require('path');

const getPath = (subPath) => { return path.join('api/users', subPath); };

const signup = async (ctx, next) => {
    const resp = await user.signup(ctx.request.body);
    ctx.ok(resp);
};

const signin = async (ctx, next) => {
    const resp = await user.signin(
        ctx.request.body.email, ctx.request.body.password
    );
    ctx.ok(resp);
};

const getMyProfile = async (ctx, next) => {
    ctx.ok(ctx.verification.user);
};

const queryById = async (ctx, next) => {
    const resp = await user.queryById(ctx.params.id);
    ctx.ok(resp);
};

const updateProfile = async (ctx, next) => {
    const resp = await user.updateById(ctx.verification.user.id,
        ctx.request.body, { curUser: ctx.verification.user });
    ctx.ok(resp);
};

const emailVerificationRequest = async (ctx, next) => {
    await user.sendVerificationEmail(
        ctx.verification.user.email, { user: ctx.verification.user }
    );
    ctx.ok();
};

const emailVerificationResponse = async (ctx, next) => {
    const resp = await user.verifyEmail(ctx.request.body.token);
    ctx.ok(resp);
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
    actions: [
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

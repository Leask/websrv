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
    ctx.ok(ctx.req.verification.user);
};

const queryById = async (ctx, next) => {
    const resp = await user.queryById(ctx.params.id);
    ctx.ok(resp);
};

const updateProfile = async (ctx, next) => {
    const resp = await user.updateById(ctx.req.verification.user.id,
        ctx.request.body, { curUser: ctx.req.verification.user });
    ctx.ok(resp);
};

const emailVerificationRequest = async (ctx, next) => {
    await user.sendVerificationEmail(
        ctx.req.verification.user.email, { user: ctx.req.verification.user }
    );
    ctx.ok();
};

const emailVerificationResponse = async (ctx, next) => {
    ctx.ok({});
};

const recoverPasswordRequest = async (ctx, next) => {
    ctx.ok({});
};

const changePassword = async (ctx, next) => {
    ctx.ok({});
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
            path: getPath('emailverification/request'),
            method: 'POST',
            process: emailVerificationRequest,
            auth: true,
        }
        // {
        //     path: ['api/poke'],
        //     method: wildcardMethod,
        //     priority: -8950,
        //     process: [poke],
        //     auth: false,
        //     upload: false,
        // },
        // {
        //     path: ['api/tokens'],
        //     method: ['GET'],
        //     priority: -8940,
        //     process: [resolveToken],
        //     auth: true,
        //     upload: false,
        // },
        // {
        //     path: wildcardPath,
        //     method: wildcardMethod,
        //     priority: 8960,
        //     process: [notFound],
        //     auth: false,
        //     upload: false,
        // },
    ],
};

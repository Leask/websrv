'use strict';

const table = 'users';
const secretFields = ['password', 'salt'];

let systemSalt = null;
let verificationThreshold = 60 * 1; // 1 minutes
let verificationMailRender = null;

const init = (options) => {
    options = options || {};
    systemSalt = utilitas.trim(options.systemSalt);
    utilitas.assert(systemSalt, 'Invalid encryption salt.', 500);
    verificationThreshold = parseInt(options.verificationThreshold) || 0;
    verificationMailRender = options.verificationMailRender;
};

const saltPassword = (password, salt) => {
    salt = salt || encryption.randomString(128);
    return { salt, password: encryption.sha256(password + salt + systemSalt) };
};

const assertId = (id, msg = 'Invalid user id.', status = 400, options = {}) => {
    utilitas.assert(id = utilitas.trim(id), msg, status, options);
    return id;
};

const assertUser = (user, msg = 'User not found', stts = 404, options = {}) => {
    utilitas.assert(user, msg, stts, options);
};

const ignore501Error = (error) => {
    if (error.status !== 501) {
        console.log(error);
        return error;
    };
};

const validateUser = (data, options) => {
    options = options || {};
    utilitas.assert(data, 'Invalid user data.', 400);
    const now = new Date();
    const password = data.password ? String(data.password || '') : null;
    const result = {
        email: data.email ? utilitas.trim(data.email) : null,
        name: data.name ? utilitas.trim(data.name) : null,
        avatar: data.avatar ? utilitas.trim(data.avatar) : null,
        bio: data.bio ? utilitas.trim(data.bio) : null,
        updatedAt: now,
    };
    if (options.create) {
        utilitas.assertEmail(result.email);
        utilitas.assert(password, 'Invalid password.', 400);
        Object.assign(result, saltPassword(password), {
            id: uuidv4(), createdAt: now, emailVerifiedAt: null,
        });
    } else if (options.update) {
        result.email && utilitas.assertEmail(result.email); // emailVerifiedAt
    } else {
        utilitas.throwError('Invalid validation type.', 500);
    }
    return result;
};

const packUser = (data, options) => {
    options = options || {};
    if (data && !options.asPlain) {
        secretFields.map((field) => { delete data[field]; });
    }
    return data;
};

const checkVerificationRequired = async (email, options) => {
    options = options || {};
    const user = options.user || await queryByEmail(email, options);
    utilitas.assert(options.force
        || !user.emailVerifiedAt, 'No verification required.', 400);
    const curToken = await token.getLatestVerificationByUser(user.id);
    const limited = curToken ? (curToken.createdAt.getTime(
    ) + 1000 * verificationThreshold > new Date().getTime()) : false;
    utilitas.assert(options.ignoreThreshold
        || !limited, 'Too many request.', 429);
    return {
        user, curToken, required: !user.emailVerifiedAt,
        verificationThreshold, limited
    };
};

const sendVerificationEmail = async (add, type, options) => {
    options = options || {};
    const resp = await checkVerificationRequired(add, options);
    resp.newToken = await token.createForVerification(resp.user.id, options);
    resp.type = utilitas.trim(type).toUpperCase();
    resp.senderName = email.getSenderName();
    let { subject, text, html } = verificationMailRender
        ? await verificationMailRender(resp) : [null, null, null];
    if (!verificationMailRender) {
        switch (resp.type) {
            case 'EMAIL':
                subject = `${resp.senderName} Email Verification`;
                break;
            case 'PASSWORD':
                subject = `${resp.senderName} Password Recovering`;
                break;
            default:
                subject = `${resp.senderName} Verification`;
        }
        text = [
            'Hi, ' + (resp.user.name || resp.user.email),
            `Your verification token is: \`${resp.newToken.id}\`.`,
            `This token will expire at ${resp.newToken.expiredAt}.`,
            resp.senderName
        ].join('\n\n');
    }
    resp.email = await email.send(add, subject, text, html, null, options);
    return resp;
};

const create = async (data, options) => {
    data = validateUser(data, { create: true });
    try {
        return await database.insert(table, data, options);
    } catch (err) {
        utilitas.assert(err.code !== 'ER_DUP_ENTRY',
            'Duplicated name or email.', 400);
        utilitas.throwError(err.message, 400);
    }
};

const queryById = async (id, options) => {
    const resp = await database.queryById(table, id, options);
    assertUser(resp);
    return packUser(resp, options);
};

const queryByKeyValue = async (key, value, options) => {
    options = options || {};
    options.unique = true;
    const resp = await database.queryByKeyValue(table, key, value, options);
    assertUser(resp);
    return packUser(resp, options);
};

const queryByEmail = async (email, options) => {
    utilitas.assertEmail(email);
    return await queryByKeyValue('email', email, options);
};

const signup = async (data, options) => {
    options = options || {};
    const user = packUser(await create(data, options));
    const auth = await token.createForUser(user.id, options);
    let mRsp = null;
    options.user = user;
    try {
        mRsp = options.skipVerify ? null
            : await sendVerificationEmail(user.email, 'EMAIL', options);
    } catch (err) { ignore501Error(err); }
    return { user, token: auth, email: mRsp };
};

const signin = async (email, password, options) => {
    let user = await queryByEmail(email, { asPlain: true });
    const { password: hashedPassword } = saltPassword(password, user.salt);
    utilitas.assert(user.password === hashedPassword, 'Invalid password.', 400);
    user = packUser(user, options);
    const auth = await token.createForUser(user.id, options);
    return { user, token: auth };
};

const deleteById = async (id) => {
    return await database.deleteById(table, id);
};

module.exports = {
    assertId,
    deleteById,
    init,
    queryByEmail,
    queryById,
    queryByKeyValue,
    signin,
    signup,
    sendVerificationEmail,
};

const { utilitas, encryption, database, email } = require('utilitas');
const uuidv4 = require('uuid').v4;
const token = require('./token');

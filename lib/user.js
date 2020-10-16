'use strict';

const typeEmail = 'EMAIL';
const typePassword = 'PASSWORD';
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

const assertPassword = (p, m = 'Invalid password.', s = 400, options = {}) => {
    utilitas.assert(p, m, s);
};

const assertUser = (user, msg = 'User not found', stts = 404, options = {}) => {
    utilitas.assert(user, msg, stts, options);
};

const handle501Error = (error) => {
    if (error.status !== 501) {
        console.log(error);
        return error;
    };
};

const handleDupEntryError = (error) => {
    utilitas.assert(error.code !== 'ER_DUP_ENTRY',
        'Duplicated name or email.', 400);
    utilitas.throwError(error.message, 400);
};

const validateUser = async (data, options) => {
    options = options || {};
    const errInvalid = 'Invalid user data.';
    utilitas.assert(data, errInvalid, 400);
    const now = new Date();
    const email = data.email ? utilitas.trim(data.email) : null;
    const name = data.name ? utilitas.trim(data.name) : null;
    const avatar = data.avatar ? utilitas.trim(data.avatar) : null;
    const bio = data.bio ? utilitas.trim(data.bio) : null;
    const password = data.password ? String(data.password || '') : null;
    const result = {};
    if (name) { result.name = name; }
    if (avatar) { result.avatar = avatar; }
    if (bio) { result.bio = bio; }
    switch (utilitas.trim(options.mode, { case: 'UP' })) {
        case 'CREATE':
            utilitas.assertEmail(result.email = email);
            assertPassword(password);
            Object.assign(result, saltPassword(password), {
                id: uuidv4(), createdAt: now, emailVerifiedAt: null,
            });
            break;
        case 'UPDATE':
            const curUser = options.curUser || await queryById(options.userId);
            utilitas.assert(curUser, errInvalid, 500);
            if (email && !utilitas.insensitiveCompare(curUser.email, email)) {
                utilitas.assertEmail(result.email = email);
                result.emailVerifiedAt = null;
            }
            break;
        case 'VERIFIED':
            result.emailVerifiedAt = now;
            break;
        case 'PASSWORDANDVERIFIED':
            result.emailVerifiedAt = now;
        case 'PASSWORD':
            assertPassword(password);
            Object.assign(result, saltPassword(password));
            break;
        default:
            utilitas.throwError('Invalid validation type.', 500);
    }
    utilitas.assert(Object.keys(result).length, errInvalid, 400);
    result.updatedAt = now;
    return result;
};

const packUser = (data, options) => {
    options = options || {};
    if (data && !options.asPlain) {
        secretFields.map((field) => { delete data[field]; });
        data.displayName = data.name || data.email.replace(/@.*/, '');
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

const rawSendVerificationEmail = async (add, type, options) => {
    options = options || {};
    if ((type = utilitas.trim(type, { case: 'UP' }))) { options.force = true; }
    const resp = await checkVerificationRequired(add, options);
    resp.newToken = await token.createForVerification(resp.user.id, options);
    resp.type = type;
    resp.senderName = email.getSenderName();
    let { subject, text, html } = verificationMailRender
        ? await verificationMailRender(resp) : [null, null, null];
    if (!verificationMailRender) {
        switch (resp.type) {
            case typeEmail:
                subject = 'Email Verification';
                break;
            case typePassword:
                subject = 'Password Recovery';
                break;
            default:
                subject = 'Verification';
        }
        text = [
            `Hi, ${resp.user.displayName}:`,
            `Your ${subject} token is: \`${resp.newToken.id}\`.`,
            `This token will expire at ${resp.newToken.expiredAt}.`,
            resp.senderName
        ].join('\n\n');
        subject = `${resp.senderName} ${subject}`;
    }
    resp.email = await email.send(add, subject, text, html, null, options);
    return resp;
};

const sendVerificationEmail = async (add, options) => {
    return await rawSendVerificationEmail(add, typeEmail, options);
};

const sendPasswordRecoveryEmail = async (add, options) => {
    return await rawSendVerificationEmail(add, typePassword, options);
};

const create = async (data, options) => {
    data = await validateUser(data, { mode: 'CREATE' });
    try {
        return packUser(await dbio.insert(table, data, options), options);
    } catch (err) { handleDupEntryError(err); }
};

const updateById = async (id, data, options) => {
    options = options || {};
    assertId(id);
    data = await validateUser(data, {
        mode: options.mode || 'UPDATE', curUser: options.curUser, userId: id
    });
    let user = null;
    try {
        options.user = user = packUser(await dbio.updateById(
            table, id, data, options
        ), options);
    } catch (err) { handleDupEntryError(err); }
    try {
        data.email && !options.skipVerify
            && await sendVerificationEmail(user.email, options);
    } catch (err) { handle501Error(err); }
    return user;
};

const changePasswordById = async (id, password, options) => {
    options = options || {};
    options.mode = 'PASSWORD';
    return await updateById(id, { password }, options);
};

const changePasswordByEmailAndPassword = async (
    email, curPassword, newPassword, options
) => {
    let user = await signin(email, curPassword, { verifyOnly: true });
    user = await changePasswordById(user.id, newPassword, options);
    return await rawSignin(user, options);
};

const changePasswordByVerificationToken = async (strTkn, password, options) => {
    const resp = await token.verifyForVerification(strTkn, { skipUser: true });
    const user = await updateById(resp.userId, { password }, {
        mode: 'PASSWORDANDVERIFIED', asPlain: true
    });
    return await rawSignin(user, options);
};

const verifyEmail = async (strTkn, options) => {
    const resp = await token.verifyForVerification(strTkn, { skipUser: true });
    const user = await updateById(resp.userId, {
    }, { mode: 'VERIFIED', asPlain: true });
    return await rawSignin(user, options);
};

const queryById = async (id, options) => {
    const resp = await dbio.queryById(table, id, options);
    assertUser(resp);
    return packUser(resp, options);
};

const queryByKeyValue = async (key, value, options) => {
    const resp = await dbio.queryByKeyValue(table, key, value, options);
    if (Array.isArray(resp)) {
        return resp.map((user) => { return packUser(user, options); });
    }
    assertUser(resp);
    return packUser(resp, options);
};

const queryByEmail = async (email, options) => {
    options = options || {};
    options.unique = true;
    utilitas.assertEmail(email);
    return await queryByKeyValue('email', email, options);
};

const queryByName = async (name, options) => {
    options = options || {};
    options.unique = true;
    return await queryByKeyValue('name', name, options);
};

const queryByIdOrEmail = async (str, options) => {
    if (utilitas.verifyEmail(str)) {
        return await queryByEmail(str, options);
    } else if (utilitas.verifyUuid(str)) {
        return await queryById(str, options);
    }
    utilitas.throwError('Invalid email or id.', 400);
};

const signup = async (data, options) => {
    options = options || {};
    const user = options.user = await create(data, options);
    const auth = await token.createForUser(user.id, options);
    try {
        !options.skipVerify && await sendVerificationEmail(user.email, options);
    } catch (err) { handle501Error(err); }
    return { user, token: auth };
};

const rawSignin = async (user, options) => {
    user = packUser(user, options);
    const auth = await token.createForUser(user.id, options);
    return { user, token: auth };
};

const signin = async (email, password, options) => {
    options = options || {};
    let user = await queryByEmail(email, { asPlain: true });
    const { password: hashedPassword } = saltPassword(password, user.salt);
    utilitas.assert(user.password === hashedPassword, 'Invalid password.', 400);
    return options.verifyOnly ? user : await rawSignin(user, options);
};

const deleteById = async (id) => {
    return await dbio.deleteById(table, id);
};

const deleteAll = async (options) => {
    return await dbio.deleteAll(table, options);
};

module.exports = {
    assertId,
    changePasswordByEmailAndPassword,
    changePasswordById,
    changePasswordByVerificationToken,
    deleteAll,
    deleteById,
    init,
    queryByEmail,
    queryById,
    queryByIdOrEmail,
    queryByKeyValue,
    queryByName,
    rawSendVerificationEmail,
    sendPasswordRecoveryEmail,
    sendVerificationEmail,
    signin,
    signup,
    updateById,
    verifyEmail,
};

const { utilitas, encryption, dbio, email } = require('utilitas');
const uuidv4 = require('uuid').v4;
const token = require('./token');

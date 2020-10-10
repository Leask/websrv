'use strict';

const table = 'users';
const secretFields = ['password', 'salt'];

let systemSalt = null;

const init = (options) => {
    options = options || {};
    systemSalt = utilitas.trim(options.systemSalt);
    utilitas.assert(systemSalt, 'Invalid encryption salt.', 500);
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
            id: uuidv4(), createdAt: now,
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

// const sendVerificationEmail = async (userId) => {
//     const {
//         user, latestCode
//     } = await checkIfEmailVerificationIsRequired(userId);
//     models.token.verifyExpired(
//         latestCode.createdAt,
//         config.emailverificationThreshold,
//         true,
//         true,
//         validator.Errors.ERR_TOO_MANY_REQUEST,
//         429
//     );
//     const token = await models.token.createEmailVerificationCode(user.id);
//     const resp = await email.sendWithTemplate(
//         user.email, 'Briko Email Verification', 'email_verification', {
//         name: user.name || user.email.replace(/(^.*)@.*$/, '$1').trim(),
//         code: token.code,
//         url: `${ config.serviceRoot } /profile`
//             + `?code=${encodeURIComponent(token.code)}`
//             + `&email=${encodeURIComponent(user.email)}`,
//     }
//     );
//     validator.assert(resp, validator.Errors.ERR_EMAIL_FAIL_TO_SEND);
//     return token;
// };

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
    // try {
    //     const emailResp = options.skipVerify
    //         || await sendVerificationEmail(user.id);
    // } catch (err) {
    //     console.log(err);
    // }
    return { user, token: auth };
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
};

const { utilitas, encryption, database, email } = require('utilitas');
const uuidv4 = require('uuid').v4;
const token = require('./token');

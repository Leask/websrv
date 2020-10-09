'use strict';

let encryptionSalt = null;

const init = (options) => {
    options = options || {};
    encryptionSalt = String(options.encryptionSalt || '');
    utilitas.assert(encryptionSalt, 'Invalid encryption salt.', 500);
};

const saltPassword = (password, salt) => {
    salt = salt || encryption.randomString(128);
    return {
        salt, password: encryption.sha256(
            `${password}${salt}${encryptionSalt}`
        ),
    };
};

const validateUser = (data, options) => {
    options = options || {};
    utilitas.assert(data, 'Invalid user data.', 400);
    const now = new Date();
    const password = data.password ? String(data.password || '') : null;
    const result = {
        email: data.email ? String(data.email || '').trim() : null,
        name: data.name ? String(data.name || '').trim() : null,
        avatar: data.avatar ? String(data.avatar || '').trim() : null,
        bio: data.bio ? String(data.bio || '').trim() : null,
        updatedAt: now,
    };
    if (options.new) {
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
    return data;
};


const signup = async (data, options) => {
    options = options || {};
    data = validateUser(data);




    // `id`              VARCHAR(255) NOT NULL,
    // `email`           VARCHAR(255) NOT NULL,
    // `password`        VARCHAR(255) NOT NULL,
    // `salt`            VARCHAR(255) NOT NULL,
    // `name`            VARCHAR(255) DEFAULT NULL,
    // `avatar`          VARCHAR(255) DEFAULT NULL,
    // `bio`             VARCHAR(255) DEFAULT NULL,
    // `emailVerifiedAt` TIMESTAMP DEFAULT NULL,
    // `createdAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    // `updatedAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,




    const sql = 'INSERT INTO `users` SET '
        + '`name`           = ?, '
        + '`email`          = ?, '
        + '`avatar`         = ?, '
        + '`password`       = ?, '
        + '`salt`           = ?, '
        + '`emailVerified`  = ?, '
        + '`language1Name`  = ?, '
        + '`language1Level` = ?, '
        + '`language2Name`  = ?, '
        + '`language2Level` = ?, '
        + '`language3Name`  = ?, '
        + '`language3Level` = ?';
    let user = null;
    let error = null;
    let auth = null;
    try {
        user = await database.pExecute(sql, [
            data.name, data.email, await models.storage.getRandomSystemAvatar(),
            password, salt, ~~options.skipVerify,
            null, null, null, null, null, null,
        ]);
    } catch (err) {
        validator.assert(
            err.code !== 'ER_DUP_ENTRY',
            validator.Errors.ERR_IS_DUPLICATED('name or email')
        );
        error = err;
    }
    validator.assert(
        !error
        && user.insertId
        && (user = await getById(user.insertId))
        && (auth = await models.token.createUserToken(user.id)),
        validator.Errors.ERR_USER_FAIL_TO_CREATE
    );
    try {
        const verifyEmailResult = options.skipVerify
            || await sendVerificationEmail(user.id);
        // console.log(verifyEmailResult);
    } catch (err) {
        console.log(err);
    }
    return { user: user, token: auth };
};

module.exports = {
    init,
    signup,
};

const { utilitas, encryption } = require('./utilitas');
const database = require('./database');
const uuidv4 = require('uuid').v4;

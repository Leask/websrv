// 'use strict';

// const rndNum = require('random-number-csprng');
// const sha1 = require('sha1');
// const database = require('./database');
// const validator = require('./validator');
// const utility = require('./utility');
// const eosUser = require('./eosUser');

// const randomString = (times) => {
//     times = parseInt(times) || 1;
//     let str = '';
//     for (let i = 0; i < times; i++) {
//         str += String(Math.random());
//     }
//     return str;
// };

// const createPassword = (salt) => {
//     salt = String(salt ? String(salt) : String((new Date()).getTime()));
//     return sha1(randomString(3) + salt);
// };

// const createToken = (salt) => {
//     return createPassword(salt) + createPassword(salt);
// };

// const createCode = async (length) => {
//     let code = config.debug && config.debugEmailVerificationCode || null;
//     if (!code) {
//         let max = '';
//         while (max.length < length) {
//             max += '9';
//         }
//         code = (String(await rndNum(0, parseInt(max) || 0))
//             + String(Math.random()).substr(2, length)).substr(1, length);
//     }
//     return code;
// };

// const trimEmailVerificationCode = (token) => {
//     return token.split('.')[1];
// };

// const packToken = async (data, options) => {
//     if (data) {
//         options = options || {};
//         switch (data.type) {
//             case 'EMAIL_VERIFICATION':
//                 data.code = trimEmailVerificationCode(data.token);
//                 break;
//         }
//     }
//     return data;
// };

// const getById = async (id) => {
//     validator.assert(id, validator.Errors.ERR_IS_REQUIRED('token id'));
//     const sql = 'SELECT * FROM `tokens` WHERE `id` = ?';
//     const data = await database.pQuery(sql, [id]);
//     return await packToken(data && data.length && data[0]);
// };

// const getByToken = async (token, options) => {
//     validator.assert(token, validator.Errors.ERR_IS_REQUIRED('token'));
//     let sql = 'SELECT * FROM `tokens` WHERE `token` = ?';
//     let val = [token];
//     options = options || {};
//     if (!options.includingExpired) {
//         sql += ' AND `expiredAt` > ?';
//         val.push(new Date());
//     }
//     const data = await database.pQuery(sql, val);
//     return await packToken(data && data.length && data[0]);
// };

// const getLatestByUserAndType = async (userId, type) => {
//     validator.assert(
//         (userId = parseInt(userId)),
//         validator.Errors.ERR_IS_REQUIRED('token user id')
//     );
//     validator.assert(
//         type, validator.Errors.ERR_IS_INVALID('token type')
//     );
//     const sql = 'SELECT * FROM `tokens` WHERE '
//         + '`userId` = ? AND `type` = ? AND `expiredAt` > ? '
//         + 'ORDER BY `createdAt` DESC LIMIT 1';
//     const val = [userId, type, new Date()];
//     let [result, error] = [null, null];
//     try {
//         result = await database.pExecute(sql, val);
//     } catch (err) {
//         error = err;
//     }
//     validator.assert(!error && result, validator.Errors.ERR_TOKEN_FAIL_TO_FIND);
//     return await packToken(result && result.length && result[0]);
// };

// const create = async (type, userId, expired) => {
//     validator.assert(
//         (userId = parseInt(userId)),
//         validator.Errors.ERR_IS_REQUIRED('token user id')
//     );
//     let token = '';
//     expired = parseInt(expired) || 0;
//     switch (type) {
//         case 'USER_TOKEN':
//             token = createToken(userId);
//             expired = expired || (1000 * 60 * 60 * 24 * 365 * 10);              // 有效期 10 年
//             break;
//         case 'EMAIL_VERIFICATION':
//             token = createToken(userId) + '.' + await createCode(6);
//             expired = expired || (1000 * 60 * 60 * 24);                         // 有效期 1 小时
//             break;
//         case 'PASSWORD_RECOVERY':
//             token = createToken(userId);
//             expired = expired || (1000 * 60 * 60 * 24);                         // 有效期 1 小时
//             break;
//         default:
//             validator.assert(
//                 false, validator.Errors.ERR_IS_INVALID('token type')
//             );
//     }
//     const sql = 'INSERT INTO `tokens` SET '
//         + '`userId`    = ?, '
//         + '`token`     = ?, '
//         + '`type`      = ?, '
//         + '`createdAt` = ?, '
//         + '`updatedAt` = ?, '
//         + '`expiredAt` = ?';
//     const now = new Date();
//     const val = [
//         userId,
//         token,
//         type,
//         now,
//         now,
//         new Date(now.getTime() + expired),
//     ];
//     let [result, error] = [null, null];
//     try {
//         result = await database.pExecute(sql, val);
//     } catch (err) {
//         error = err;
//     }
//     validator.assert(
//         !error && result.insertId && (result = await getById(result.insertId)),
//         validator.Errors.ERR_TOKEN_FAIL_TO_CREATE
//     );
//     return result;
// };

// const createUserToken = async (userId) => {
//     return await create('USER_TOKEN', userId);
// };

// const createEmailVerificationCode = async (userId) => {
//     return await create('EMAIL_VERIFICATION', userId);
// };

// const createPasswordRecoveryToken = async (userId) => {
//     return await create('PASSWORD_RECOVERY', userId);
// };

// const verifyToken = async (token, type) => {
//     const objToken = await getByToken(token);
//     validator.assert(
//         objToken && objToken.type === type,
//         validator.Errors.ERR_IS_INVALID('token')
//     );
//     return objToken;
// };

// const verifyUserToken = async (token) => {
//     const objToken = await verifyToken(token, 'USER_TOKEN');
//     const objUser = await models.user.getById(objToken.userId);
//     validator.assert(objUser, validator.Errors.ERR_IS_INVALID('token'));
//     eosUser.syncByUserId(objUser.id);
//     return { token: objToken, user: objUser };
// };

// const verifyPasswordRecoveryToken = async (token) => {
//     const objToken = await verifyToken(token, 'PASSWORD_RECOVERY');
//     const objUser = await models.user.getById(objToken.userId);
//     validator.assert(objUser, validator.Errors.ERR_IS_INVALID('token'));
//     return { token: objToken, user: objUser };
// };

// const verifyExpired = (expiredAt, timeShift, reverse, assert, aErr, aCode) => {
//     let result = utility.isDate(expiredAt, true) && (expiredAt.getTime(
//     ) + (parseInt(timeShift) || 0) > (utility.getCurrentTimestamp()));
//     result = reverse ? !result : result;
//     if (assert) {
//         validator.assert(
//             result, aErr || validator.Errors.ERR_TOKEN_EXPIRED, aCode
//         );
//     }
//     return result;
// };

// const revoke = async (condition, value, options) => {
//     validator.assert(
//         ['id', 'token'].includes(condition) && value,
//         validator.Errors.ERR_IS_INVALID('token condition')
//     );
//     options = options || {};
//     const sql = 'UPDATE `tokens` SET `expiredAt` = ? '
//         + `WHERE \`${condition}\` = ? `
//         + 'ORDER BY `createdAt` DESC LIMIT 1';
//     const val = [
//         new Date(new Date().getTime() + 1000 * (parseInt(options.delay) || 0)),
//         value
//     ];
//     let [result, error] = [null, null];
//     try {
//         result = await database.pExecute(sql, val);
//     } catch (err) {
//         error = err;
//     }
//     validator.assert(
//         result && result.affectedRows && !error,
//         validator.Errors.ERR_TOKEN_FAIL_TO_REVOKE
//     );
//     return result;
// };

// const revokeById = async (id, options) => {
//     return await revoke('id', id, options) && await getById(id, options);
// };

// const revokeByToken = async (token, options) => {
//     return await revoke('token', token, options)
//         && await getByToken(token, { includingExpired: true });
// };

// module.exports = {
//     create,
//     createUserToken,
//     createPassword,
//     verifyPasswordRecoveryToken,
//     createEmailVerificationCode,
//     createPasswordRecoveryToken,
//     verifyUserToken,
//     createCode,
//     getLatestByUserAndType,
//     verifyExpired,
//     revokeById,
//     revokeByToken,
// };

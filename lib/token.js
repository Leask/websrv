'use strict';

const table = 'tokens';
const typeUser = 'USER';
const typeVerification = 'VERIFICATION';
const sec1Day = 60 * 60 * 24;
const sec7Days = sec1Day * 7;
const sec1Year = sec1Day * 365 * 10;

const assertToken = (token) => {
    utilitas.assert(token, 'Invalid token.', 401);
};

const assertTokenString = (token) => {
    assertToken(token = utilitas.trim(token));
    return token;
};

const assertType = (type) => {
    utilitas.assert(type = utilitas.trim(type), 'Invalid token type.', 400);
    return type.toUpperCase();
};

const delay = (se, now) => {
    return new Date((now || new Date()).getTime() + 1000 * (parseInt(se) || 0));
};

const create = async (type, userId, expireInSecond, options) => {
    const now = new Date();
    return database.insert(table, {
        id: encryption.randomString(128),
        userId: user.assertId(userId),
        type: assertType(type),
        createdAt: now,
        updatedAt: now,
        expiredAt: delay(expireInSecond || sec7Days, now),
    }, options);
};

const createForUser = async (userId, options) => {
    return await create(typeUser, userId, sec1Year, options); // 10 years
};

const createForVerification = async (userId, options) => {
    return await create(typeVerification, userId, sec7Days, options); // 7 days
};

const getLatestByUserAndType = async (userId, type) => {
    const sql = database.assembleQuery(table)
        + ' WHERE `userId` = ? AND `type` = ?'
        + ' ORDER BY `createdAt` DESC LIMIT 1';
    const val = [user.assertId(userId), assertType(type)];
    const resp = await database.query(sql, val);
    return resp && resp.length ? resp[0] : null;
};

const getLatestVerificationByUser = async (userId) => {
    return await getLatestByUserAndType(userId, typeVerification);
};

const verify = async (token, type, options) => {
    options = options || {};
    token = assertTokenString(token);
    type = assertType(type);
    const sql = database.assembleQuery(table)
        + ' WHERE `id` = ? AND `type` = ? AND `expiredAt` > ?';
    const resp = (await database.query(sql, [token, type, new Date()]))[0];
    if (resp && !options.skipUser) {
        resp.user = await user.queryById(resp.userId, options);
    }
    assertToken(options.skipUser ? resp : (resp && resp.user));
    return resp;
};

const verifyForUser = async (token, options) => {
    return verify(token, typeUser, options);
};

const verifyForVerification = async (token, options) => {
    return verify(token, typeVerification, options);
};

const ensureAuthorization = async (ctx, next) => {
    assertToken(ctx.req.verification && ctx.req.verification.user);
    await next();
};

const revoke = async (key, value, options) => {
    options = options || {};
    return await database.updateByKeyValue(table, key, value, {
        expiredAt: delay(options.delay),
    }, options);
};

const revokeById = async (id, options) => {
    return await revoke('id', id, options);
};

const revokeByUserId = async (userId, options) => {
    return await revoke('userId', userId, options);
};

const deleteById = async (id) => {
    return await database.deleteById(table, id);
};

const cleanup = async () => {
    const sql = `DELETE FROM \`${table}\` WHERE \`expiredAt\` < ?`
    return await database.execute(sql, [new Date()]);
};

const deleteAll = async (options) => {
    return await database.deleteAll(table, options);
};

module.exports = {
    cleanup,
    create,
    createForUser,
    createForVerification,
    deleteAll,
    deleteById,
    ensureAuthorization,
    getLatestByUserAndType,
    getLatestVerificationByUser,
    revoke,
    revokeById,
    revokeByUserId,
    verify,
    verifyForUser,
    verifyForVerification,
};

const { utilitas, encryption, database } = require('utilitas');
const user = require('./user');

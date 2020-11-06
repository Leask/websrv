'use strict';

const table = 'tokens';
const typeUser = 'USER';
const typeVerification = 'VERIFICATION';
const sec1Day = 60 * 60 * 24;
const sec7Days = sec1Day * 7;
const sec10Year = sec1Day * 365 * 10;
const newId = () => { return uoid.create({ file: __filename, security: 1 }); };

const assertToken = (token) => {
    utilitas.assert(token, 'Invalid token.', 401);
};

const assertTokenString = (token) => {
    assertToken(token = utilitas.trim(token));
    return token;
};

const assertType = (type) => {
    type = utilitas.trim(type, { case: 'UP' });
    utilitas.assert(type, 'Invalid token type.', 400);
    return type;
};

const delay = (se, now) => {
    return new Date((now || new Date()).getTime() + 1000 * (parseInt(se) || 0));
};

const create = async (tokenType, userId, expireInSecond, options) => {
    const now = new Date();
    return dbio.insert(table, {
        id: newId(),
        userId: user.assertId(userId),
        type: assertType(tokenType),
        createdAt: now,
        updatedAt: now,
        expiredAt: delay(expireInSecond || sec7Days, now),
    }, options);
};

const createForUser = async (userId, options) => {
    return await create(typeUser, userId, sec10Year, options);
};

const createForVerification = async (userId, options) => {
    await revokeByUserIdAndType(userId, typeVerification);
    return await create(typeVerification, userId, sec7Days, options);
};

const getLatestByUserAndType = async (userId, type) => {
    const sql = dbio.assembleQuery(table)
        + ' WHERE `userId` = ? AND `type` = ?'
        + ' ORDER BY `createdAt` DESC LIMIT 1';
    const val = [user.assertId(userId), assertType(type)];
    const resp = await dbio.query(sql, val);
    return resp && resp.length ? resp[0] : null;
};

const getLatestVerificationByUser = async (userId) => {
    return await getLatestByUserAndType(userId, typeVerification);
};

const verify = async (token, options) => {
    options = Object.assign(options || {}, { withExternalIdentity: true });
    token = assertTokenString(token);
    options.type = options.type ? assertType(options.type) : null;
    const sql = dbio.assembleQuery(table)
        + ' WHERE `id` = ? AND `expiredAt` > ?';
    const resp = (await dbio.query(sql, [token, new Date()]))[0];
    assertToken(resp && (!options.type || options.type === resp.type));
    if (!options.skipUser) {
        assertToken(resp.user = await user.queryById(resp.userId, options));
    }
    try {
        if (options.refresh) {
            const delayOpts = { delay: options.refresh };
            Object.assign(resp, buildRevoke(delayOpts));
            revokeById(token, delayOpts);
        }
    } catch (err) { console.log(err); }
    return resp;
};

const verifyForUser = async (token, options) => {
    options = options || {};
    options.type = typeUser;
    options.refresh = sec10Year;
    return verify(token, options);
};

const verifyForVerification = async (token, options) => {
    options = options || {};
    options.type = typeVerification;
    options.refresh = options.refresh || 1;
    return verify(token, options);
};

const ensureAuthorization = async (ctx, next) => {
    assertToken(ctx.verification && ctx.verification.user);
    await next();
};

const buildRevoke = (options) => {
    return { expiredAt: delay(options && options.delay) };
};

const revoke = async (key, value, options) => {
    options = options || {};
    return await dbio.updateByKeyValue(
        table, key, value, buildRevoke(options), { skipEcho: true }
    );
};

const revokeById = async (id, options) => {
    return await revoke('id', id, options);
};

const revokeByUserId = async (userId, options) => {
    return await revoke('userId', userId, options);
};

const revokeByUserIdAndType = async (userId, type, options) => {
    user.assertId(userId);
    let { sql, values } = dbio.assembleUpdate(table, buildRevoke(options));
    sql += ` WHERE ${dbio.rawAssembleKeyValue('userId', userId)}`
        + ` AND ${dbio.rawAssembleKeyValue('type', type)}`;
    return await dbio.query(sql, [...values, userId, type]);
};

const revokeVerificationByUserId = async (userId, options) => {
    return await revokeByUserIdAndType(userId, typeVerification, options);
};

const deleteById = async (id) => {
    return await dbio.deleteById(table, id);
};

const cleanup = async () => {
    const sql = `DELETE FROM \`${table}\` WHERE \`expiredAt\` < ?`
    return await dbio.query(sql, [new Date()]);
};

const deleteAll = async (options) => {
    return await dbio.deleteAll(table, options);
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
    revokeByUserIdAndType,
    revokeVerificationByUserId,
    verify,
    verifyForUser,
    verifyForVerification,
};

const { utilitas, dbio, uoid } = require('utilitas');
const user = require('./user');

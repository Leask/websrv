'use strict';

const storageSubPath = 'storage';
const defaultPermissions = '0777';

let objMulter = null;

const log = (content) => { return utilitas.modLog(content, __filename); };

const getPublicPath = (options) => {
    return utilitas.ensureArray(options.publicPath
        || path.join(path.dirname(module.filename), '../public'));
};

const getBufferPath = (options) => {
    return options.bufferPath || '/tmp';
};

const getStoragePath = (options) => {
    return options.storagePath || getPublicPath(options)[0];
};

const touchPath = async (path, options) => {
    options = options || {};
    await fs.promises.mkdir(path, { recursive: true });
    await fs.promises.chmod(path, options.permissions || defaultPermissions);
    return await fs.promises.stat(path);
};

const allocate = async (filename, options) => {
    options = options || {};
    filename = (options.newName ? uuidv4()
        : await encryption.sha256File(filename)) + path.parse(filename).ext;
    const subPath = path.join(storageSubPath, filename.substr(0, 2),
        filename.substr(2, 2), filename);
    const fullPath = path.join(getStoragePath(options), subPath);
    const slot = Object.assign(path.parse(fullPath), {
        url: `${global.websrv.origin}/${subPath}`, path: fullPath, subPath,
    });
    slot.destination = slot.dir; delete slot.dir;
    slot.filename = slot.base; delete slot.base;
    try { slot.fileStat = await fs.promises.stat(fullPath); } catch (err) { }
    if (options.touchPath) { slot.dirStat = await touchPath(slot.destination); }
    return slot;
};

const publish = async (options) => {
    options = options || {};
    const arrPath = getPublicPath(options);
    for (let pubPath of arrPath) {
        await storage.assertPath(pubPath, 'D', 'R');
        global.websrv.app.use(serve(pubPath));
        log(`PUBLIC ${pubPath}`);
    }
    return arrPath;
};

const accept = async (options) => {
    options = options || {};
    const bufferPath = getBufferPath(options);
    log(`BUFFER ${bufferPath}`);
    return objMulter = multer(options.multer || {
        storage: multer.diskStorage({
            destination: bufferPath,
            filename: (req, file, cbf) => {
                cbf(null, uuidv4(
                ) + path.parse(file.originalname).ext.toLowerCase());
            },
        }),
    });
};

const share = async (ctx, next) => {
    for (let i in ctx.req.files || []) {
        const slot = await allocate(ctx.req.files[i].path, { touchPath: true });
        if (slot.fileStat) {
            await fs.promises.unlink(ctx.req.files[i].path);
            log(`DUPLICATE: ${slot.filename}`);
        } else {
            await fs.promises.rename(ctx.req.files[i].path, slot.path);
            slot.fileStat = await fs.promises.stat(slot.path);
        }
        ctx.req.files[i] = Object.assign(ctx.req.files[i], slot);
    }
    await next();
};

const init = async (options) => {
    await publish(options);
    await accept(options);
};

const upload = (method = 'any', options) => {
    return objMulter[method](options);
};

module.exports = {
    accept,
    init,
    publish,
    upload,
    share,
};

const { utilitas, storage, encryption } = require('utilitas');
const multer = require('koa-multer');
const uuidv4 = require('uuid').v4;
const serve = require('koa-static');
const path = require('path');
const fs = require('fs');


// const saveFile = async (userId, location, file) => {
//     const sql = 'INSERT INTO `files` SET '
//         + '`userId`    = ?, '
//         + '`filename`  = ?, '
//         + '`mimetype`  = ?, '
//         + '`createdAt` = ?, '
//         + '`updatedAt` = ?';
//     const now = new Date();
//     let result = null;
//     try {
//         result = await db.pExecute(sql, [
//             userId,
//             location.subPath,
//             file.mimetype,
//             now,
//             now,
//         ]);
//     } catch (err) {
//         console.log(err);
//     }
//     return result;
// };

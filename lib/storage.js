'use strict';

const defaultPermissions = '0777';

let objMulter = null;

const getPublicPath = (options) => {
    return options.publicPath
        || path.join(path.dirname(module.filename), '../public');
};

const getStoragePath = (options) => {
    return options.storagePath || getPublicPath(options);
};

const touchPath = async (path, options) => {
    options = options || {};
    await fs.promises.mkdir(path, { recursive: true });
    await fs.promises.chmod(path, options.permissions || defaultPermissions);
    return await fs.promises.stat(path);
};

const allocate = async (filename, storagePath, options) => {
    options = options || {};
    filename = String(filename || '').trim();
    filename = `${uuidv4()}${filename ? '-' : ''}${filename}`;
    const subPath = path.join(
        'storage', filename.substr(0, 2), filename.substr(2, 2), filename
    );
    const fullPath = path.join(storagePath, subPath);
    const slot = Object.assign(path.parse(fullPath), {
        url: `${global.websrv.origin}/${subPath}`, path: fullPath, subPath
    }, options.meta ? { meta: options.meta } : {});
    if (options.touchPath) { slot.dirStat = await touchPath(slot.dir); }
    return slot;
};

const publish = async (options) => {
    options = options || {};
    const arrPath = utilitas.ensureArray(getPublicPath(options));
    for (let pubPath of arrPath) {
        await storage.assertPath(pubPath, 'D', 'R');
        global.websrv.app.use(serve(pubPath));
    }
    return arrPath;
};

const accept = async (options) => {
    options = options || {};
    const stgPath = getStoragePath(options);
    await storage.assertPath(stgPath, 'D', 'W');
    return objMulter = multer({
        storage: multer.diskStorage({
            destination: stgPath,
            filename: (req, file, cbf) => {
                req.fileSlots = req.fileSlots || {};
                (async () => {
                    const slot = await allocate(file.originalname, stgPath, {
                        meta: file, touchPath: true,
                    });
                    req.fileSlots[slot.name] = slot;
                    // await saveFile(req.verification.user.id, location, file);
                    cbf(null, slot.subPath);
                })();
            },
        }),
    });
};

const init = async (options) => {
    await accept(options);
    await publish(options);
};

const upload = (method = 'any', options) => {
    return objMulter[method](options);
};

module.exports = {
    accept,
    init,
    publish,
    upload,
};

const { utilitas, storage } = require('utilitas');
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
//         result = await database.pExecute(sql, [
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

'use strict';

const table = 'files';
const storageSubPath = 'storage';
const defaultPermissions = '0777';
const defaultMetadata = { cacheControl: 'public, max-age=31536000' };

let objMulter = null;
let googleCloudStorageClient = null;
let googleCloudStorageBucket = null;
let googleCloudStorageUrl = null;

const log = (content) => { return utilitas.modLog(content, __filename); };

const handle501Error = (error) => {
    if (error.status !== 501) {
        console.log(error);
        return error;
    };
};

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
    await fs.mkdir(path, { recursive: true });
    await fs.chmod(path, options.permissions || defaultPermissions);
    return await fs.stat(path);
};

const formatPath = (filename, options) => {
    const subPath = path.join(storageSubPath,
        filename.substr(0, 2), filename.substr(2, 2), filename);
    const fullPath = path.join(getStoragePath(options), subPath);
    const url = `${googleCloudStorageUrl || global.websrv.origin}/${subPath}`;
    return { subPath, fullPath, url };
};

const allocate = async (filename, options) => {
    options = options || {};
    filename = (options.newName ? uuidv4()
        : await encryption.sha256File(filename)) + path.parse(filename).ext;
    const { subPath, fullPath, url } = formatPath(filename, options);
    const slot = Object.assign(path.parse(fullPath),
        { url, path: fullPath, subPath });
    slot.destination = slot.dir; delete slot.dir;
    slot.filename = slot.base; delete slot.base;
    try {
        slot.fileStat = await (googleCloudStorageClient
            ? existsOnGoogleCloud(subPath) : fs.stat(fullPath));
    } catch (err) { }
    if (options.touchPath) { slot.dirStat = await touchPath(slot.destination); }
    console.log(slot);
    return slot;
};

const packFile = async (data, options) => {
    options = options || {};
    if (data && !options.asPlain) {
        data.url = formatPath(data.filename, options).url;
    }
    if (data && data.userId && !options.skipUser) {
        data.user = options.user || await user.queryById(data.userId);
    }
    return data;
};

const record = async (data, options) => {
    const now = new Date();
    const field = {
        id: uuidv4(),
        userId: data.userId || '',
        filename: data.filename,
        originalname: data.originalname || '',
        mimetype: data.mimetype || '',
        size: data.size || 0,
        createdAt: now,
        updatedAt: now,
    };
    try {
        return packFile(await dbio.insert(table, field, options), options);
    } catch (err) { handle501Error(err); }
};

const existsOnGoogleCloud = async (destination) => {
    return (await googleCloudStorageClient.file(destination).exists(
    ))[0] ? {} : null;
};

const uploadToGoogleCloud = async (filename, destination) => {
    return await googleCloudStorageClient.upload(filename,
        { gzip: true, destination, metadata: defaultMetadata });
};

const publish = async (options) => {
    options = options || {};
    const arrPath = getPublicPath(options);
    for (let pubPath of arrPath) {
        await storage.assertPath(pubPath, 'D', 'R');
        global.websrv.app.use(serve(pubPath));
        log(`PUBLIC: ${pubPath}`);
    }
    return arrPath;
};

const accept = async (options) => {
    options = options || {};
    const bufferPath = getBufferPath(options);
    log(`BUFFER: ${bufferPath}`);
    googleCloudStorageBucket = options.googleCloudStorageBucket;
    googleCloudStorageUrl = options.googleCloudStorageUrl;
    if (googleCloudStorageBucket && googleCloudStorageUrl) {
        log(`GOOGLE CLOUD STORAGE: ${googleCloudStorageUrl}`);
        storage.assertPath(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'F', 'R',
            'Error loading Google Application Credentials.', 500);
        const { Storage } = require('@google-cloud/storage');
        googleCloudStorageClient = new Storage(
        ).bucket(googleCloudStorageBucket);
    } else if (googleCloudStorageBucket || googleCloudStorageUrl) {
        utilitas.throwError('Invalid Google Cloud Storage configuration.', 500);
    }
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

// https://github.com/googleapis/nodejs-storage/blob/master/samples/uploadFile.js
const share = async (ctx, next) => {
    for (let i in ctx.req.files || []) {
        const slot = await allocate(ctx.req.files[i].path, { touchPath: true });
        if (slot.fileStat) {
            log(`DUPLICATE: ${slot.filename}`);
        } else if (googleCloudStorageBucket) {
            slot.fileStat = await uploadToGoogleCloud(ctx.req.files[i].path,
                slot.subPath);
        } else {
            await fs.rename(ctx.req.files[i].path, slot.path);
            slot.fileStat = await fs.stat(slot.path);
        }
        try { await fs.unlink(ctx.req.files[i].path); } catch (err) { }
        try {
            slot.receipt = await record({
                id: uuidv4(),
                userId: ctx.verification && ctx.verification.user.id,
                filename: slot.filename,
                originalname: ctx.req.files[i].originalname,
                mimetype: ctx.req.files[i].mimetype,
                size: ctx.req.files[i].size,
            }, { user: ctx.verification.user });
        } catch (err) { handle501Error(err); }
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

const { utilitas, storage, dbio, encryption } = require('utilitas');
const multer = require('koa-multer');
const uuidv4 = require('uuid').v4;
const serve = require('koa-static');
const user = require('./user');
const path = require('path');
const fs = require('fs').promises;

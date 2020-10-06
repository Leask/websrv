'use strict';

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const multer = require('koa-multer');
const utility = require('./utility');
const database = require('./database');
const validator = require('./validator');

const nameRegExp = /filename=\"(.*)\"/gi;

const defaultPermissions = '0777';

const pwd = __dirname.replace(/\/models$/, '');

const systemAvatarsPath = `${config.publicPath}/${config.avatarsPath}`;

const systemAvatarsUrlR = `${config.serviceRoot}/avatars/`;

const fileTypes = {
    image: ['jpg', 'jpeg', 'gif', 'png', 'tif', 'tiff', 'bmp'],
    audio: ['mp3', 'aac', 'm4a', 'ogg'],
    video: ['api', 'm4v', 'mpg', 'mpeg', 'mp4'],
    text: ['txt', 'md'],
    json: ['json'],
    markdown: ['md', 'markdown', 'mmd', 'multimarkdown'],
};

let systemAvatars = null;

const removeTrailingSlash = (path) => {
    return (path || '').replace(/\/$/, '');
};

const addTrailingSlash = (path) => {
    return (path || '') + '/';
};

const ensureTrailingSlash = (path) => {
    return addTrailingSlash(removeTrailingSlash(path));
};

const quickStat = async (path) => {
    let stat = null;
    try {
        stat = await fs.promises.stat(path);
    } catch (err) {
        // console.log(err);
    }
    return stat;
};

const verifyPath = (path) => {
    return /^(\.?\/|~[^\/]*\/)/.test(String(path));
};

const locateRoot = (root, options) => {
    options = options || {};
    const result = {
        root: utility.getType(root) === 'Undefined' ? 'UNDEFINED' : root,
        isPublic: false,
    };
    switch (result.root) {
        case 'PUBLIC':
            result.isPublic = true;
            result.root = path.join(pwd, config.publicPath);
            break;
        case 'STORAGE':
            result.isPublic = true;
            result.root = path.join(pwd, config.publicPath, config.storagePath);
            break;
        case 'TEMP':
            result.root = path.join(pwd, config.tempPath);
            break;
        case 'PROJECTROOT':
        case 'UNDEFINED':
        case '':
        case false:
        case null:
            result.root = pwd;
            break;
        default:
    }
    validator.assert(
        verifyPath(result.root),
        validator.Errors.ERR_INVALID_FILE_DIRECTORY_PATH,
        500
    );
    result.root = removeTrailingSlash(result.root);
    return result;
};

const touch = async (path, options) => {
    options = options || {};
    let [result, error] = [null, null];
    try {
        await fs.promises.mkdir(path);
        await fs.promises.chmod(path, options.permissions || defaultPermissions);
        result = await quickStat(path);
    } catch (err) {
        console.log((error = err));
    }
    validator.assert(
        result && !error, validator.Errors.ERR_INVALID_FILE_DIRECTORY_PATH, 500
    );
    return result;
};

const touchPath = async (strPath, options) => {
    options = options || {};
    const arrPath = (strPath || '').split('/');
    validator.assert(
        arrPath.length, validator.Errors.ERR_INVALID_FILE_DIRECTORY_PATH, 500
    );
    strPath = '';
    let firstItem = true;
    let touchResult = null;
    for (let item of arrPath) {
        strPath += (firstItem ? '' : '/') + item;
        firstItem = false;
        if (strPath && !await quickStat(strPath)) {
            touchResult = await touch(strPath, options);
        }
    }
    return touchResult;
};

const getStandarLocation = async (filename, root, options) => {
    options = options || {};
    filename = (filename || '').trim().toLowerCase();
    filename = uuid.v4() + (filename ? '-' : '') + filename;
    root = locateRoot(root, options);
    const sp = path.join(
        config.storagePath,
        filename.substr(0, 2),
        filename.substr(2, 2),
        filename
    );
    const location = path.parse(path.join(root.root, sp));
    location.isPublic = root.isPublic;
    location.url = root.isPublic ? `${config.serviceRoot}/${sp}` : null;
    location.subPath = sp;
    location.path = path.join(location.dir, location.base);
    if (options.touchPath) {
        location.dirStat = await touchPath(location.dir);
    }
    return location;
};

const getStandarPublicLocation = async (filename, options) => {
    options = options || {};
    options.touchPath = true;
    return await getStandarLocation(filename, 'PUBLIC', options);
};

const saveFile = async (userId, location, file) => {
    const sql = 'INSERT INTO `files` SET '
        + '`userId`    = ?, '
        + '`filename`  = ?, '
        + '`mimetype`  = ?, '
        + '`createdAt` = ?, '
        + '`updatedAt` = ?';
    const now = new Date();
    let result = null;
    try {
        result = await database.pExecute(sql, [
            userId,
            location.subPath,
            file.mimetype,
            now,
            now,
        ]);
    } catch (err) {
        console.log(err);
    }
    return result;
};

const upload = multer({
    storage: multer.diskStorage({
        destination: path.join(pwd, `${config.publicPath}/`),
        filename: (req, file, cbf) => {
            (async () => {
                const location = await getStandarPublicLocation(
                    file.originalname
                );
                await saveFile(req.verification.user.id, location, file);
                req.newFileLocation = location;
                cbf(null, location.subPath);
            })();
        },
    }),
});

const loadSystemAvatars = async () => {
    return (await fs.promises.readdir(systemAvatarsPath)).filter(
        x => /\.(png|jpg|jpeg|gif)$/i.test(x)
    ).map(x => `${systemAvatarsUrlR}${x}`);
};

const checkSystemAvatars = async () => {
    return systemAvatars || (systemAvatars = await loadSystemAvatars());
};

const getRandomSystemAvatar = async () => {
    return utility.random(await checkSystemAvatars());
};

module.exports = {
    pwd,
    upload,
    getRandomSystemAvatar,
};



// (async () => {
//     try {
//         // console.log(await getRandomSystemAvatar());
//         // console.log(await getStandarPublicLocation());
//         // console.log(touchPath('~/file.js/1231231'));
//         // console.log(touchPath('file.js/1231'));
//     } catch (err) {
//         console.log(err);
//     }
//     // console.log(await touchPath(`${__dirname}/file.js`));
// })();


    // console.log(await fs.promises.stat(path));
    // let exist = false;

    // async.series([
    //     function(cbf) {
    //         fs.stat(path, function(err, file) {
    //             exist = !err && file;
    //             cbf();
    //         });
    //     },
    //     function(cbf) {
    //         if (exist) {
    //             return cbf();
    //         }
    //         fs.mkdir(path, cbf);
    //     },
    //     function(cbf) {
    //         fs.chmod(path, '0777', cbf); // @todo maybe it should be an option by @leask
    //     },
    // ], callback);

// const descPath = (path, root) => {
//     // root = locate(root);

// };

// //     root = ensureTrailingSlash(root);
// // mapPath

// //     // return {
// //     //     path : `${root}/${path}`,
// //     //     url  : '',
// //     // };
// // path,

// };


// (async () => {
//     try {
//         console.log(locateRoot('file.js', 'TEMP'));
//     } catch (err) {
//         console.log(err);
//     }
//     // console.log(await touchPath(`${__dirname}/file.js`));
// })();







// if (true) {
//     return;
// }


// let create = function(
//     filename, size, url, relatedClass, relatedId,
//     relatedField, userId, options, callback
// ) {
//     if (!filename) {
//         return callback('Error filename.');
//     }
//     if (!size) {
//         return callback('Error file size.');
//     }
//     if (!url) {
//         return callback('Error file url.');
//     }
//     // if (!relatedClass || !relatedId || !relatedField) {
//     //     return callback('Error related object.');
//     // }
//     if (!userId) {
//         return callback('Error file uploader.');
//     }
//     let file = {
//         filename     : filename,
//         size         : parseInt(size),
//         url          : url,
//         relatedClass : relatedClass ? relatedClass : '',
//         relatedId    : String(relatedId ? relatedId : ''),
//         relatedField : relatedField ? relatedField : '',
//         userId       : parseInt(userId),
//     };
//     global.mm.mongo.create(collection, file, null, options, callback);
// };

// let touchPath = function(path, options, callback) {
//     let exist = false;
//     async.series([
//         function(cbf) {
//             fs.stat(path, function(err, file) {
//                 exist = !err && file;
//                 cbf();
//             });
//         },
//         function(cbf) {
//             if (exist) {
//                 return cbf();
//             }
//             fs.mkdir(path, cbf);
//         },
//         function(cbf) {
//             fs.chmod(path, '0777', cbf); // @todo maybe it should be an option by @leask
//         },
//     ], callback);
// };

// let getNewFilePath = function(rawFilename, useRawFileName, sub, parent, callback) {
//     if (!rawFilename && useRawFileName) {
//         return callback('Error rawFilename.');
//     }
//     let newFilename   = md5(
//         !rawFilename || !useRawFileName
//             ? global.mm.token.createToken()
//             : rawFilename.trim().toLowerCase()
//     );
//     let extension     = rawFilename ? rawFilename.replace(/^.*\.([^\.]*)$/, '$1') : '';
//     if (extension && rawFilename !== extension) {
//         newFilename += '.' + extension;
//     }
//     let basePath = __dirname + '/../' + (parent ? parent : 'public');
//     let dir      = [newFilename.substr(0, 2), newFilename.substr(2, 2)];
//     let subPath  = (parent ? '' : '/storage') + (sub ? ('/' + sub) : '');
//     let mixPath  = () => { return basePath + subPath; };
//     touchPath(mixPath(), null, () => {
//         subPath += '/' + dir[0];
//         touchPath(mixPath(), null, () => {
//             subPath += '/' + dir[1];
//             touchPath(mixPath(), null, () => {
//                 let baseName = subPath + '/' + newFilename;
//                 let result   = {
//                     filename : newFilename,
//                     folder   : mixPath(),
//                     path     : basePath + baseName
//                 };
//                 result.url = global.config.file_url_prex + baseName;
//                 callback(null, result);
//             });
//         });
//     });
// };

// let upload = function(
//     reqFile, allowTypes, relatedClass, relatedId,
//     relatedField, userId, options, callback
// ) {
//     options = options ? options : {};
//     if (!reqFile || !reqFile.originalname || !reqFile.size || !reqFile.path) {
//         return callback('Error file uploading request.');
//     }
//     if (fileTypes[allowTypes]) {
//         allowTypes = fileTypes[allowTypes];
//     }
//     if (allowTypes && allowTypes.length) {
//         if (!new RegExp(
//             '^[^\\.]*\\.(' + allowTypes.join('|') + ')$', 'i'
//         ).test(reqFile.originalname)) {
//             return callback('Error file type: ' + reqFile.originalname);
//         }
//     }
//     // if (!relatedClass || !relatedId || !relatedField) {
//     //     return callback('Error related object.');
//     // }
//     if (!userId) {
//         return callback('Error file uploader.');
//     }
//     let objFile  = null;
//     async.series([
//         function(cbf) {
//             getNewFilePath(reqFile.originalname, false, null, null, function(err, data) {
//                 objFile = data;
//                 cbf(err);
//             });
//         },
//         function(cbf) {
//             fs.rename(reqFile.path, objFile.path, cbf);
//         },
//         function(cbf) {
//             if (options.skipOss) {
//                 return cbf();
//             }
//             global.mm.oss.put(objFile.url.split('/').splice(
//                 -4, 4
//             ).join('/'), objFile.path, function(err, ossFile) {
//                 if (err || !ossFile) {
//                     return cbf(options.forceOss ? (err || (
//                         'Error up loading file to oss: ' + ossFile.path
//                     )) : null);
//                 }
//                 objFile.url = ossFile.url;
//                 if (options.keepLocalCopy) {
//                     cbf();
//                 }
//                 fs.unlink(objFile.path, function(err) {
//                     if (err) {
//                         console.log(err);
//                     }
//                     cbf();
//                 });
//             });
//         },
//         function(cbf) {
//             create(
//                 reqFile.originalname, reqFile.size, objFile.url, relatedClass,
//                 relatedId, relatedField, userId, options, cbf
//             );
//         },
//     ], function(err) {
//         callback(err, objFile);
//     });
// };

// let writeNewFile = function(rawFilename, buffer, callback) {
//     getNewFilePath(rawFilename, null, null, null, function(err, file) {
//         if (err) {
//             return callback(err);
//         }
//         fs.writeFile(file.path, buffer, function(err) {
//             callback(err, file);
//         });
//     });
// };

// let fetchFromWechat = function(wechatApi, userId, mediaId, callback) {
//     wechatApi.getMedia(mediaId, function(err, buffer, res) {
//         if (err) {
//             return callback(err);
//         }
//         let filename = md5(res.headers['content-disposition'])
//                      + res.headers['content-disposition'].replace(
//                          /^.*filename=\"[^\"\.]*(.*)\".*$/, '$1'
//                      );
//         writeNewFile(filename, buffer, function(err, file) {
//             if (err) {
//                 return callback(err);
//             }
//             global.wd.$create(
//                 'file', {userId : userId, url : file.url},
//                 null, null, {}, callback
//             );
//         }
//         );
//     });
// };

// let fetchFromUrl = function(url, options, callback) {
//     options = options ? options : {};
//     if (!url) {
//         return callback('Error url.');
//     }
//     let req = request(url);
//     req.on('error', function(err) {
//         // @todo: Handle connection errors
//         console.log(err);
//     });
//     let bufferedResponse = req.pipe(through2(function(chunk, enc, cbf) {
//         this.push(chunk);
//         cbf();
//     }));
//     req.on('response', function(res) {
//         if (res.statusCode < 200 || res.statusCode > 299) {
//             return callback('Error statusCode: ' + res.statusCode + '.');
//         }
//         let ext = (res.headers['content-disposition']
//             ? nameRegExp.exec(res.headers['content-disposition'])[1] : '')
//                 || (res.headers['content-type']
//                     ? res.headers['content-type'].split('/')[1] : '');
//         let name = md5(url) + (ext ? ('.' + ext) : '');
//         getNewFilePath(
//             name, true,
//             options.path ? options.path : null,
//             options.root ? options.root : null,
//             function(err, file) {
//                 if (err) {
//                     return callback(err);
//                 }
//                 let objFile = fs.createWriteStream(file.path);
//                 objFile.on('error', function(err) {
//                     // @todo: Handle write errors
//                     console.log(err);
//                 });
//                 objFile.on('finish', function(err, d) {
//                     callback(err, file);
//                 });
//                 bufferedResponse.pipe(objFile);
//             }
//         );
//     });
// };

// let copy = function(source, destination, callback) {
//     let streamRead  = fs.createReadStream(source),
//         streamWrite = fs.createWriteStream(destination),
//         called      = false,
//         done        = function(err, data) {
//             if (!called) {
//                 called = true;
//                 callback(err, data);
//             }
//         };
//     streamRead.on('error', done);
//     streamWrite.on('error', done);
//     streamWrite.on('close', (err) => {
//         fs.chmod(destination, '0666', (err) => { // @todo maybe it should be an option by @leask
//             if (err) {
//                 global.mm.runtime.logError(err);
//             }
//             done(null, {source : source, destination : destination});
//         });
//     });
//     streamRead.pipe(streamWrite);
// };

// let readFile = function(path, options, callback) {
//     options = options ? options : {};
//     fs.stat(path, function(err, stat) {
//         if (err || !stat) {
//             return callback(new Error('File not found: ' + path));
//         }
//         fs.readFile(path, 'utf8', function(err, file) {
//             if (err || !options.delete) {
//                 return callback(err, file);
//             }
//             fs.unlink(path, function(err) {
//                 callback(err, file);
//             });
//         });
//     });
// };

// let readFiles = function(paths, options, callback) {
//     let arrErr = [],
//         result = {};
//     async.eachSeries(paths, function(file, cbf) {
//         readFile(file, options, function(err, resp) {
//             if (err) {
//                 arrErr.push(err);
//             } else {
//                 result[file] = resp;
//             }
//             cbf();
//         });
//     }, function() {
//         callback(arrErr.length ? arrErr : null, result);
//     });
// };

// let readJson = function(path, options, callback) {
//     readFile(path, options, function(err, file) {
//         if (err || !file) {
//             return callback(err, file);
//         }
//         let data = null;
//         var err  = null;
//         try {
//             data = JSON.parse(file);
//         } catch (e) {
//             err = e;
//         }
//         callback(err, data);
//     });
// };

// let writeFile = function(path, data, options, callback) {
//     options = options ? options : {};
//     options.encoding = options.encoding ? options.encoding : 'utf8';
//     fs.writeFile(path, data, options, callback);
// };

// let writeJson = function(path, data, options, callback) {
//     writeFile(path, JSON.stringify(data), options, callback);
// };

// let getSize = function(path, options, callback) {
//     options = options ? options : {};
//     fs.stat(path, function(err, stats) {
//         if (err || !stats) {
//             return callback(err || 'Error getting file stats.');
//         }
//         let sizeInBytes = stats.size;
//         let size        = sizeInBytes;
//         switch (options.unit) {
//         case 'kb':
//             size = sizeInBytes / 1000.0;
//             break;
//         case 'mb':
//             size = sizeInBytes / 1000000.0;
//             break;
//         }
//         callback(null, size);
//     });
// };

// let deleteFiles = function(files, callback) {
//     let arrErr = [];
//     let count  = 0;
//     async.eachSeries(files ? files : [], function(file, cbf) {
//         fs.unlink(file, function(err) {
//             if (err) {
//                 arrErr.push(err);
//             } else {
//                 count++;
//             }
//             cbf();
//         });
//     }, function() {
//         callback(arrErr.length ? arrErr : null, count);
//     });
// };

// let tree = function(path, options, callback) {
//     options = options ? options : {};
//     let resource = [];
//     fs.readdir(path, function(err, resp) {
//         if (err) {
//             return callback(err, resource);
//         } else if (resp
//                 && resp.length === 0
//                 && options.deleteEmptySubFolder
//                 && options.recurred) {
//             return fs.rmdir(path, callback);
//         }
//         options.recurred = true;
//         async.eachSeries(resp, function(item, cbf) {
//             item = path + '/' + item;
//             fs.stat(item, function(err, stat) {
//                 if (err
//                  || typeof options.max !== 'undefined' && options.max <= 0) {
//                     return cbf(err);
//                 }
//                 if (!stat.isDirectory()) {
//                     resource.push(item);
//                     if (typeof options.max !== 'undefined') {
//                         options.max--;
//                     }
//                     return cbf();
//                 }
//                 tree(item, options, function(err, subResp) {
//                     resource = resource.concat((subResp = subResp ? subResp : []));
//                     if (err) {
//                         console.log(err);
//                     }
//                     cbf();
//                 });
//             });
//         }, function(err) {
//             callback(err, resource);
//         });
//     });
// };

// /**
//  * 创建一个完整目录路径，中途所有不存在的子目录都会被创建
//  * @author KK
//  * @param {*} fullpath
//  * @param {*} options
//  * @param {*} callback
//  */
// let createFullDirectory = (fullpath, options, callback) => {
//     fs.stat(fullpath, (err, stat) => {
//         if (stat){
//             return callback(null, fullpath);
//         }

//         let parentDir = path.dirname(fullpath);
//         fs.stat(parentDir, (err, stat) => {
//             if (!stat){
//                 return createFullDirectory(parentDir, options, (err, createdPath) => {
//                     if (err){
//                         return callback(err);
//                     }

//                     return touchPath(fullpath, options, (err) => {
//                         return callback(null, fullpath);
//                     });
//                 });
//             }

//             return touchPath(fullpath, options, (err) => {
//                 return callback(null, fullpath);
//             });
//         });
//     });
// };

// module.exports = {
//     getNewFilePath      : getNewFilePath,
//     writeNewFile        : writeNewFile,
//     fetchFromWechat     : fetchFromWechat,
//     fetchFromUrl        : fetchFromUrl,
//     copy                : copy,
//     touchPath           : touchPath,
//     readFiles           : readFiles,
//     readJson            : readJson,
//     writeJson           : writeJson,
//     getSize             : getSize,
//     upload              : upload,
//     deleteFiles         : deleteFiles,
//     tree                : tree,
//     createFullDirectory : createFullDirectory,
// };

// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Router = require('koa-router');
// const router = new Router();
// const basename = path.basename(module.filename);
// const ctrlPath = path.join(__dirname, 'controllers');

// // load controllers
// let ctl = {};
// fs.readdirSync(ctrlPath).filter(function(file) {
//     return file.indexOf('.') !== 0 && file !== basename;
// }).forEach(file => {
//     ctl[file.replace(/^(.*)\.js$/, '$1')] = require(path.join(ctrlPath, file));
// });

// router.all('*', lib.api.errorHandler);
// router.all('*', lib.api.extendCtx);

// // config routes
// router.post('/api/chain/blocks', lib.api.ensureApiTokenOrSignature(), ctl.apiChain.saveToChain);
// router.get('/api/chain/blocks/:blockNumOrId', ctl.apiChain.getBlock);
// router.get('/api/chain/transactions/:id/blocknum', ctl.apiChain.getBlockNumByTransactionId);
// router.get('/api/chain/transactions/:id', ctl.apiChain.getTransactionById);
// router.get('/api/chain/statements/:account', ctl.apiChain.queryStatements);
// router.get('/api/chain/transactions', ctl.apiChain.queryTransactions);
// router.get('/api/chain/accounts/:id', ctl.apiChain.getAccount);
// router.get('/api/chain', ctl.apiChain.getInfo);
// router.get('/api/defi/prices/:currency/:period', ctl.apiDefi.queryPrices);

// router.all('*', (ctx, next) => {
//     ctx.er({
//         error: 'API not found.'
//     }, 404);
// });

// // bind
// global.app.use(router.routes()).use(router.allowedMethods());



// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Router = require('koa-router');
// const storage = require('./models/storage');
// const { ensureAuthorization } = require('./models/api');

// const basename = path.basename(module.filename);
// const ctrlPath = path.join(__dirname, 'controllers');

// const buildRouter = (options) => {
//     const router = new Router(options);
//     // load controllers
//     let ctl = {};
//     fs.readdirSync(ctrlPath)
//         .filter(function(file) {
//             return file.indexOf('.') !== 0 && file !== basename;
//         })
//         .forEach(file => {
//             ctl[file.replace(/^(.*)\.js$/, '$1')] = require(path.join(ctrlPath, file));
//         });

//     router.all('*', models.api.errorHandler);
//     router.all('*', models.api.extendCtx);
//     router.all('/api/*', models.api.verifyToken);

//     // config routes
//     router.get('/api/v1/system/info', ctl.apiSystem.getInfo);
//     router.post('/api/v1/users/signup', ctl.apiUser.signup);
//     router.post('/api/v1/users/signin', ctl.apiUser.signin);
//     router.post('/api/v1/users/emailverification/request', ensureAuthorization, ctl.apiUser.emailVerificationRequest);
//     router.post('/api/v1/users/emailverification/response', ensureAuthorization, ctl.apiUser.emailVerificationResponse);
//     router.get('/api/v1/users/debug', ctl.apiUser.debug);
//     router.post('/api/v1/users/me/promote', ensureAuthorization, ctl.apiUser.promoteMe);
//     router.post('/api/v1/users/me', ensureAuthorization, ctl.apiUser.updateMyProfile);
//     router.post('/api/v1/users/password/recover', ctl.apiUser.recoverPasswordRequest);
//     router.post('/api/v1/users/password', ctl.apiUser.changePassword);
//     router.get('/api/v1/users/me', ensureAuthorization, ctl.apiUser.getMyProfile);
//     router.get('/api/v1/users/:id', ctl.apiUser.getById);
//     router.post('/api/v1/tokens', ensureAuthorization, ctl.apiToken.refresh);
//     router.delete('/api/v1/tokens', ensureAuthorization, ctl.apiToken.revoke);
//     router.post('/api/v1/finance/exchangerpbybge', ensureAuthorization, ctl.apiFinance.exchangeRpByBge);
//     router.get('/api/v1/finance/transactions', ensureAuthorization, ctl.apiFinance.getTransactions);
//     router.post('/api/v1/tasks/:id/take', ensureAuthorization, ctl.apiTask.takeById);
//     router.post('/api/v1/tasks/:id/giveup', ensureAuthorization, ctl.apiTask.giveupById);
//     router.post('/api/v1/tasks/:id/submit', ensureAuthorization, ctl.apiTask.submitById);
//     router.get('/api/v1/tasks/:id/messages', ensureAuthorization, ctl.apiTask.getMessagesById);
//     router.get('/api/v1/tasks/mine', ensureAuthorization, ctl.apiTask.getMine);
//     router.get('/api/v1/tasks/:id', ctl.apiTask.getById);
//     router.get('/api/v1/tasks', ctl.apiTask.query);
//     router.get('/api/v1/messages/:id', ensureAuthorization, ctl.apiMessage.getById);
//     router.get('/api/v1/messages', ensureAuthorization, ctl.apiMessage.queryWithUserId);
//     router.post('/api/v1/storage', ensureAuthorization, storage.upload.single('file'), ctl.apiStorage.upload);
//     router.get('/api/v1/languages', ctl.apiLanguages.getAll);

//     router.all('*', (ctx, next) => {
//         return new Promise((resolve, reject) => {
//             if (/^\/api\/.*/.test(ctx.request.url)) {
//                 ctx.er({
//                     error: 'API not found.'
//                 }, 404);
//                 return resolve();
//             }
//             fs.readFile('./public/web/index.html', 'utf8', (err, resp) => {
//                 if (err) {
//                     return reject(err);
//                 }
//                 ctx.body = resp;
//                 resolve();
//             });
//         });
//     });
//     return router;
// };

// module.exports = buildRouter;

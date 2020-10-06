'use strict';

const IGNORE_EXCEPTIONS = ['connect ETIMEDOUT'];

module.exports = (err) => {
    if (IGNORE_EXCEPTIONS.includes(err.message)) {
        console.log(`This message can be ignored: 【${err.message}】`);
        return false;
    }
    throw err;
};

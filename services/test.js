'use strict';

const action = async () => {
    console.log('OK');
};

module.exports = {
    run: true,
    func: action,
    interval: 1,
    tout: 60,
    delay: 3,
};

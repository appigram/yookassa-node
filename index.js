'use strict';

const init = require('./lib/index');

module.exports = init;

// Expose constructor as a named property to enable mocking with Sinon.JS
module.exports.YooKassa = init.YooKassa;

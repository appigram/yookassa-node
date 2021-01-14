'use strict';

const uuidv4 = require('uuid/v4');
const rp = require('request-promise');
const Promise = require('bluebird');
const errors = require('./errors');
const { ACCEPTED, NOT_FOUND } = require('./constants');

const processError = error => {
  if (error instanceof errors.StatusCodeError && error.statusCode !== NOT_FOUND) {
    return new errors.PaymentError(error.error);
  }

  return error;
};

const request = (method, func, payload, idempotenceKey) => {
  const _self = this;


  /**
   * Generate idempotence key if not present
   * @see https://kassa.yandex.ru/docs/checkout-api/#idempotentnost
   */

  if (!idempotenceKey) {
    idempotenceKey = uuidv4();
  }
  const uri = this.root + func;


  if (this.debug) {
    // eslint-disable-next-line no-console
    console.log(`${method}: ${uri}`);
  }

  return rp({
    method,
    json: true,
    uri,
    body: payload,
    timeout: this.timeout,

    /**
     * @see https://kassa.yandex.ru/docs/checkout-api/#autentifikaciq
     */
    auth: {
      user: this.shopId,
      pass: this.secretKey,
    },
    resolveWithFullResponse: true,
    headers: {

      /**
       * @see https://kassa.yandex.ru/docs/checkout-api/#idempotentnost
       */
      'Idempotence-Key': idempotenceKey,
    },
  }).then(response => {
    switch (response.statusCode) {
      /**
       * Implementation of async actions with retries
       * @see https://kassa.yandex.ru/docs/checkout-api/#asinhronnost
       */
      case ACCEPTED:
        return Promise.delay(response.body.retry_after)
          .then(request.bind(_self, method, func, payload, idempotenceKey));

      /**
       * Normal response
       */
      default:
        return response.body;
    }
  })
    .catch(error =>

    /**
     * @see https://kassa.yandex.ru/docs/checkout-api/#oshibki
     */
      Promise.reject(processError(error)));
};

module.exports = { request };

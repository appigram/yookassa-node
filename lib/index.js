'use strict';

const utils = require('./utils');
const Payment = require('./models/payment');
const Refund = require('./models/refund');

const YooKassa = function(shopId, secretKey) {
  let options = {};

  if (typeof shopId === 'object') {
    options = shopId;
  } else {
    options = {
      shopId,
      secretKey,
    };
  }

  this.shopId = options.shopId;
  this.secretKey = options.secretKey;
  this.root = (options.base_host || YooKassa.DEFAULT_BASE_HOST)
    + (options.base_path || YooKassa.DEFAULT_BASE_PATH);
  this.debug = options.debug || YooKassa.DEFAULT_DEBUG;
  this.timeout = options.timeout || YooKassa.DEFAULT_TIMEOUT;
};

YooKassa.PACKAGE_VERSION = require('../package.json').version;
YooKassa.DEFAULT_BASE_HOST = 'https://api.yookassa.ru';
YooKassa.DEFAULT_BASE_PATH = '/v3/';
YooKassa.DEFAULT_DEBUG = false;

// Use node's default timeout:
YooKassa.DEFAULT_TIMEOUT = require('http').createServer().timeout;

YooKassa.prototype = {

  /**
   * Create new payment
   * @see https://yookassa.ru/developers/api#create_payment
   * @param {Object} payload
   * @paramExample
   * {
   *   amount': {
   *     'value': '2.00',
   *     'currency': 'RUB'
   *   },
   *   'payment_method_data': {
   *     'type': 'bank_card'
   *   },
   *   'confirmation': {
   *     'type': 'redirect',
   *     'return_url': 'https://www.merchant-website.com/return_url'
   *   }
   * }
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Object>}
   * @exampleObject
   * {
   *   id: '215d8da0-000f-50be-b000-0003308c89be',
   *   status: 'waiting_for_capture',
   *   paid: true,
   *   amount:
   *   {
   *     value: '2.00',
   *     currency: 'RUB'
   *   },
   *   confirmation:
   *   {
   *     type: 'redirect',
   *     return_url: 'https://www.merchant-website.com/return_url',
   *     confirmation_url:
   * 'https://yoomoney.ru/payments/external/confirmation?orderId=22e12f66-000f-5000-8000-18db351245c7'
   *  },
   *   created_at: '2017-11-10T05:54:42.563Z',
   *   metadata: {},
   *   payment_method:
   *   {
   *     type: 'bank_card',
   *     id: '215d8da0-000f-50be-b000-0003308c89be',
   *     saved: false
   *  },
   *   recipient:
   *   {
   *     account_id: 'your_shop_id',
   *     gateway_id: 'gateaway_id'
   *   }
   * }
   */
  _createPayment(payload, idempotenceKey) {
    return utils.request.call(this, 'POST', 'payments', payload, idempotenceKey);
  },

  /**
   *
   * @see _createPayment()
   * @param {Object} payload
   * @paramExample
   * {
   *   amount':
   *   {
   *     'value': '2.00',
   *     'currency': 'RUB'
   *   },
   *   'payment_method_data': {
   *     'type': 'bank_card'
   *   },
   *   'confirmation': {
   *     'type': 'redirect',
   *     'return_url': 'https://www.merchant-website.com/return_url'
   *   }
   * }
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Payment>}
   */
  createPayment(payload, idempotenceKey) {
    const _self = this;

    return this._createPayment(payload, idempotenceKey).then(data => new Payment(_self, data));
  },

  /**
   * @see https://yookassa.ru/developers/api#get_payment
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Object>}
   * @returnExample
   * {
   *   id: '215d8da0-000f-50be-b000-0003308c89be',
   *   status: 'waiting_for_capture',
   *   paid: false,
   *   amount:
   *   {
   *     value: '2.00',
   *     currency: 'RUB'
   *   },
   *   created_at: '2017-11-10T05:54:42.563Z',
   *   metadata: {},
   *   payment_method:
   *   {
   *     type: 'bank_card',
   *     id: '215d8da0-000f-50be-b000-0003308c89be',
   *     saved: false
   *   },
   *   recipient:
   *   {
   *     account_id: 'your_shop_id',
   *    gateway_id: 'gateaway_id'
   *   }
   * }
   */
  _getPaymentInfo(paymentId, idempotenceKey) {
    return utils.request.call(this, 'GET', `payments/${paymentId}`, {}, idempotenceKey);
  },

  /**
   * Get info about payment by id
   * @see _getPaymentInfo()
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Payment>}
   */
  getPayment(paymentId, idempotenceKey) {
    const _self = this;

    return this._getPaymentInfo(paymentId, idempotenceKey).then(data => new Payment(_self, data));
  },

  /**
   * Capture payment with status 'waiting_for_capture'. status change to 'succeeded'
   * @see https://yookassa.ru/developers/api#capture_payment
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {Object} amount
   * @paramExample
   * {
   *   "amount": {
   *     "value": "2.00",
   *     "currency": "RUB"
   *   }
   * }
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Object>}
   * @returnExample
   * {
   *   "id": "215d8da0-000f-50be-b000-0003308c89be",
   *   "status": "succeeded",
   *   "paid": true,
   *   "amount":
   *   {
   *     "value": "2.00",
   *     "currency": "RUB"
   *   },
   *   "created_at": "2017-11-10T05:58:42.563Z",
   *   "metadata": {},
   *   payment_method:
   *   {
   *     type: 'bank_card',
   *     id: '215d8da0-000f-50be-b000-0003308c89be',
   *     saved: false
   *   },
   *   recipient:
   *   {
   *     account_id: 'your_shop_id',
   *     gateway_id: 'gateaway_id'
   *   }
   * }
   */
  _capturePayment(paymentId, amount, idempotenceKey) {
    return utils.request.call(
      this, 'POST', `payments/${paymentId}/capture`,
      { amount },
      idempotenceKey,
    );
  },

  /**
   * @see _capturePayment()
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {Object} amount
   * @paramExample
   * {
   *   "amount": {
   *     "value": "2.00",
   *     "currency": "RUB"
   *   }
   * }
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Payment>}
   */
  capturePayment(paymentId, amount, idempotenceKey) {
    const _self = this;

    return this._capturePayment(paymentId, amount, idempotenceKey).then(data => new Payment(_self, data));
  },

  /**
   * Cancel payment with status 'waiting_for_capture'. status change to 'canceled'
   * @see https://yookassa.ru/developers/api#cancel_payment
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Object>}
   * @returnExample
   * {
   *   "id": "215d8da0-000f-50be-b000-0003308c89be",
   *   "status": "canceled",
   *   "paid": true,
   *   "amount":
   *  {
   *     "value": "2.00",
   *     "currency": "RUB"
   *   },
   *   "created_at": "2017-11-10T05:58:42.563Z",
   *   "metadata": {},
   *   payment_method:
   *   {
   *     type: 'bank_card',
   *     id: '215d8da0-000f-50be-b000-0003308c89be',
   *     saved: false
   *   },
   *   recipient:
   *   {
   *     account_id: 'your_shop_id',
   *     gateway_id: 'gateaway_id'
   *   }
   * }
   */
  _cancelPayment(paymentId, idempotenceKey) {
    return utils.request.call(
      this, 'POST', `payments/${paymentId}/cancel`, {},
      idempotenceKey,
    );
  },

  /**
   * @see _cancelPayment()
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Payment>}
   */
  cancelPayment(paymentId, idempotenceKey) {
    const _self = this;

    return this._cancelPayment(paymentId, idempotenceKey).then(data => new Payment(_self, data));
  },

  /**
   * Create new refund
   * @see https://yookassa.ru/developers/api#create_refund
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {Object} amount
   * @paramExample
   * {
   *   "amount": {
   *     "value": "2.00",
   *     "currency": "RUB"
   *   }
   * }
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Object>}
   */
  _createRefund(paymentId, amount, idempotenceKey) {
    return utils.request.call(
      this, 'POST', 'refunds',
      {
        amount,
        payment_id: paymentId,
      },
      idempotenceKey,
    );
  },

  /**
   * @see _createRefund()
   * @param {string} paymentId
   * @paramExample '215d8da0-000f-50be-b000-0003308c89be'
   * @param {Object} amount
   * @paramExample
   * {
   *   "amount": {
   *     "value": "2.00",
   *     "currency": "RUB"
   *   }
   * }
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Refund>}
   * @returnExample
   * {
   *   "id": "216749f7-0016-50be-b000-078d43a63ae4",
   *   "status": "succeeded",
   *   "amount":
   *   {
   *     "value": "1",
   *     "currency": "RUB"
   *   },
   *   "authorized_at": "2017-11-10T19:27:51.609Z",
   *   "created_at": "2017-10-04T19:27:51.407Z",
   *   "payment_id": "215d8da0-000f-50be-b000-0003308c89be"
   * }
   */
  createRefund(paymentId, amount, idempotenceKey) {
    const _self = this;


    return this._createRefund(paymentId, amount, idempotenceKey).then(data => new Refund(_self, data));
  },

  /**
   * Get info about refund by id
   * @see https://yookassa.ru/developers/api#get_refund
   * @param {string} refundId
   * @paramExample '216749f7-0016-50be-b000-078d43a63ae4'
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Object>}
   * @returnExample
   * {
   *   "id": "216749f7-0016-50be-b000-078d43a63ae4",
   *   "status": "succeeded",
   *   "amount":
   *   {
   *     "value": "1",
   *     "currency": "RUB"
   *   },
   *   "authorized_at": "2017-11-10T19:27:51.609Z",
   *   "created_at": "2017-10-04T19:27:51.407Z",
   *   "payment_id": "219752e2-000f-50bf-b000-03f3dda898c8"
   * }
   */
  _getRefundInfo(refundId, idempotenceKey) {
    return utils.request.call(this, 'GET', `refunds/${refundId}`, {}, idempotenceKey);
  },

  /**
   * @see _getRefundInfo
   * @param {string} refundId
   * @paramExample '216749f7-0016-50be-b000-078d43a63ae4'
   * @param {string} idempotenceKey
   * @paramExample '6daac9fa-342d-4264-91c5-b5eafd1a0010'
   * @returns {Promise<Refund>}
   */
  getRefund(refundId, idempotenceKey) {
    const _self = this;


    return this._getRefundInfo(refundId, idempotenceKey).then(data => new Refund(_self, data));
  },
};

/**
 * @param {string} shopId
 * @param {string} secretKey
 * @returns {YooKassa}
 */
const init = (shopId, secretKey) => new YooKassa(shopId, secretKey);

module.exports = init;
module.exports.YooKassa = YooKassa;

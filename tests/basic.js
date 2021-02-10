const chai = require('chai');

const { expect } = chai;

const sinon = require('sinon');

const responses = require('./successResponses');

const errorResponse = require('./errorResponses');

const YooKassa = require('../lib/index')({ shopId: 'your_shop_id', secretKey: 'your_secret_key' });

const idempotenceKey = 1;

const paymentInfo = {
  amount: {
    value: '2.00',
    currency: 'RUB',
  },
  payment_method_data: { type: 'bank_card' },
  confirmation: {
    type: 'redirect',
    return_url: 'https://www.merchant-website.com/return_url',
  },
};

const infoWithoutConfirm = {
  amount: {
    value: '2.00',
    currency: 'RUB',
  },
  payment_method_data: { type: 'bank_card' },
};

describe('Test all functionality', () => {
  describe('Tests for creating payment', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createPayment').resolves(responses.responseForCreate);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createPayment(paymentInfo, idempotenceKey);
    });

    describe('Creating payment', () => {
      it('should success create new payment', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('status');
          expect(data).to.have.property('payment_method');
          expect(data).to.have.property('recipient');
          done();
        });
      });
    });
  });

  describe('Tests for get information about payment', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_getPaymentInfo').resolves(responses.responseForGetInfo);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.getPayment(responses.responseForCreate.id);
    });

    describe('Get info about payment by id', () => {
      it('should return information about payment', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('status');
          expect(data).to.have.property('paid');
          expect(data).to.have.property('payment_method');
          expect(data).to.have.property('recipient');
          done();
        });
      });
    });
  });

  describe('Tests for payment confirm', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_capturePayment').resolves(responses.responseForConfirmPayment);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.capturePayment(
        responses.responseForCreate.id,
        {
          value: '2.00',
          currency: 'RUB',
        }, idempotenceKey,
      );
    });

    describe('Confirmation payment', () => {
      it('should return information about success confirmed payment', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('status');
          expect(data).to.have.property('paid');
          expect(data.paid).to.equal(true);
          expect(data).to.have.property('payment_method');
          expect(data).to.have.property('recipient');
          done();
        });
      });
    });
  });

  describe('Tests for cancel payment', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_cancelPayment').resolves(responses.responseForCancelPayment);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.cancelPayment(responses.responseForCreate.id, idempotenceKey);
    });

    describe('Cancel payment', () => {
      it('should return information about canceled payment', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('status');
          expect(data).to.have.property('paid');
          expect(data.status).to.equal('canceled');
          expect(data).to.have.property('payment_method');
          expect(data).to.have.property('recipient');
          done();
        });
      });
    });
  });

  describe('Tests create refund', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createRefund').resolves(responses.responseForRefundCreateAndGet);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createRefund(
        responses.responseForCreate.id,
        {
          value: '2.00',
          currency: 'RUB',
        }, idempotenceKey,
      );
    });

    describe('Creating refund', () => {
      it('should return information about success created payment', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('status');
          expect(data).to.have.property('amount');
          expect(data.status).to.equal('succeeded');
          expect(data).to.have.property('payment_id');
          done();
        });
      });
    });
  });

  describe('Tests for get information about refund', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_getRefundInfo').resolves(responses.responseForRefundCreateAndGet);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.getRefund(responses.responseForRefundCreateAndGet.id, idempotenceKey);
    });

    describe('Get info about refund', () => {
      it('should return information about refund', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('amount');
          expect(data).to.have.property('status');
          expect(data).to.have.property('payment_id');
          done();
        });
      });
    });
  });

  describe('failed creating payment with authentication error', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createPayment').resolves(errorResponse.authenticationFailed);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createPayment(paymentInfo, idempotenceKey);
    });

    describe('failed creating payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('description');
          expect(data).to.have.property('code');
          expect(data.code).to.equal('invalid_credentials');
          expect(data.description).to.equal('Basic authentication failed');
          done();
        });
      });
    });
  });

  describe('Tests for get information about payment with error', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_getPaymentInfo').resolves(errorResponse.paymentNotFound);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.getPayment(responses.responseForRefundCreateAndGet.id);
    });

    describe('Get info about payment by id', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('description');
          expect(data).to.have.property('code');
          expect(data.code).to.equal('not_found');
          expect(data.description).to.equal('Payment not found or forbidden');
          done();
        });
      });
    });
  });

  describe('Tests for get information about refund with error', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_getRefundInfo').resolves(errorResponse.refundNotFound);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.getRefund(responses.responseForCreate.id);
    });

    describe('Get info about refund by id', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('description');
          expect(data).to.have.property('code');
          expect(data.code).to.equal('not_found');
          expect(data.description).to.equal('Refund not found or forbidden');
          done();
        });
      });
    });
  });

  describe('Tests for create payment without idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createPayment').resolves(errorResponse.emptyIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createPayment(paymentInfo);
    });

    describe('failed creating payment without idempotence key', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key is empty');
          done();
        });
      });
    });
  });

  describe('Tests for create refund without idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createRefund').resolves(errorResponse.emptyIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createRefund(paymentInfo);
    });

    describe('failed creating refund without idempotence key', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key is empty');
          done();
        });
      });
    });
  });

  describe('Tests for capture payment without idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_capturePayment').resolves(errorResponse.emptyIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.capturePayment(paymentInfo);
    });

    describe('failed capture payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key is empty');
          done();
        });
      });
    });
  });

  describe('Tests for cancel payment without idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_cancelPayment').resolves(errorResponse.emptyIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.cancelPayment(paymentInfo);
    });

    describe('failed cancel payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key is empty');
          done();
        });
      });
    });
  });

  describe('Tests for create payment with duplicate of idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createPayment').resolves(errorResponse.duplicateIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createPayment(paymentInfo);
    });

    describe('failed creating payment with duplicate of idempotence key', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key duplicated');
          done();
        });
      });
    });
  });

  describe('Tests for create refund with duplicate of idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createRefund').resolves(errorResponse.duplicateIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createRefund(paymentInfo);
    });

    describe('failed creating payment with duplicate of idempotence key', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key duplicated');
          done();
        });
      });
    });
  });

  describe('Tests for capture payment with duplicate of idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_capturePayment').resolves(errorResponse.duplicateIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.capturePayment(paymentInfo);
    });

    describe('failed capture payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key duplicated');
          done();
        });
      });
    });
  });

  describe('Tests for cancel payment without idempotence key', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_cancelPayment').resolves(errorResponse.duplicateIdempotenceKey);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.cancelPayment(paymentInfo);
    });

    describe('failed cancel payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Idempotence key duplicated');
          done();
        });
      });
    });
  });

  describe('Tests for create payment without confirmation info', () => {
    let test;

    let stub;

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_createPayment').resolves(errorResponse.missingConfirmType);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = YooKassa.createPayment(infoWithoutConfirm, idempotenceKey);
    });

    describe('failed creating payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_request');
          expect(data.description).to.equal('Missing confirmation type for payment method type: bank_card');
          done();
        });
      });
    });
  });

  describe('Tests for authentication fail', () => {
    let test;

    let stub;

    const failYooKassa = require('../lib/index')('your_shop_id', 'your_secret_key');

    before(() => {
      stub = sinon.stub(YooKassa.__proto__, '_getPaymentInfo').resolves(errorResponse.authenticationFailed);
    });

    after(() => {
      stub.restore();
    });

    before(() => {
      test = failYooKassa.getPayment(responses.responseForGetInfo.id);
    });

    describe('failed creating payment', () => {
      it('should return error', done => {
        test.then(data => {
          expect(data).to.be.an('object');
          expect(data).to.have.property('id');
          expect(data).to.have.property('type');
          expect(data).to.have.property('code');
          expect(data).to.have.property('description');
          expect(data.code).to.equal('invalid_credentials');
          expect(data.description).to.equal('Basic authentication failed');
          done();
        });
      });
    });
  });
});

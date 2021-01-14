const YandexCheckout = require('../../lib/index')({ shopId: 'your_shop_id', secretKey: 'your_secret_key' });

const paymentId = 'your_payment_id';

const idempotenceKey = 'your_idempotence_key'; // It is not required

YandexCheckout.getRefund(paymentId, idempotenceKey)
  .then(result => {
    console.log({ payment: result });
  })
  .catch(err => {
    console.error(err);
  });

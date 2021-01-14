const YandexCheckout = require('../../lib/index')({ shopId: 'your_shop_id', secretKey: 'your_secret_key' });

const paymentId = 'your_payment_id';

const idempotenceKey = 'your_idempotence_key'; // It is not required

YandexCheckout.createRefund(
  paymentId,
  {
    value: '2.00',
    currency: 'RUB',
  }, idempotenceKey,
)
  .then(result => {
    console.log({ refund: result });
  })
  .catch(err => {
    console.error(err);
  });

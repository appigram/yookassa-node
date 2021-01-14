const YandexCheckout = require('../../lib/index')({ shopId: 'your_shop_id', secretKey: 'your_secret_key' });

const idempotenceKey = 'your_idempotence_key'; // It is not required

YandexCheckout.createPayment({
  amount: {
    value: '2.00',
    currency: 'RUB',
  },
  payment_method_data: { type: 'bank_card' },
  confirmation: {
    type: 'redirect',
    return_url: 'https://www.merchant-website.com/return_url',
  },
}, idempotenceKey)
  .then(result => {
    console.log({ payment: result });
  })
  .catch(err => {
    console.error(err);
  });

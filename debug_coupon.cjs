require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ML_API_URL = 'https://api.mercadolibre.com';

async function main() {
  const integration = await prisma.mLIntegration.findFirst();
  const accessToken = integration.accessToken;

  // Buscar venda no banco
  const sale = await prisma.sale.findFirst({
    where: { mlOrderId: '2000017558898572' },
    include: { product: true },
  });
  console.log('=== VENDA NO BANCO ===');
  if (sale) {
    console.log('couponDiscount:', sale.couponDiscount);
    console.log('productCost:', sale.productCost);
    console.log('quantity:', sale.quantity);
    console.log('salePrice:', sale.salePrice);
    console.log('grossProfit:', sale.grossProfit);
  } else {
    console.log('Venda não encontrada no banco');
  }
  console.log('');

  // Buscar pedido na API do ML
  console.log('=== PEDIDO NO ML ===');
  const orderResp = await fetch(`${ML_API_URL}/orders/2000017558898572`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!orderResp.ok) {
    console.log('Erro ao buscar pedido:', orderResp.status);
    return;
  }

  const order = await orderResp.json();

  console.log('total_amount:', order.total_amount);
  console.log('paid_amount:', order.paid_amount);
  console.log('');

  console.log('=== ORDER_ITEMS ===');
  for (const item of (order.order_items || [])) {
    console.log(JSON.stringify(item, null, 2));
  }

  console.log('=== PAYMENTS ===');
  for (const payment of (order.payments || [])) {
    console.log(JSON.stringify(payment, null, 2));
  }

  // Buscar item ML
  const itemId = order.order_items?.[0]?.item?.id;
  if (itemId) {
    console.log('');
    console.log('=== ITEM ML ===');
    const itemResp = await fetch(`${ML_API_URL}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (itemResp.ok) {
      const item = await itemResp.json();
      console.log('price:', item.price);
      console.log('original_price:', item.original_price);
    }
  }

  // Buscar pagamento
  const paymentId = order.payments?.[0]?.id;
  if (paymentId) {
    console.log('');
    console.log(`=== PAYMENT ${paymentId} ===`);
    const payResp = await fetch(`${ML_API_URL}/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (payResp.ok) {
      const pay = await payResp.json();
      console.log('coupon_amount:', pay.coupon_amount);
      console.log('transaction_amount:', pay.transaction_amount);
      console.log('total_paid_amount:', pay.total_paid_amount);
      console.log('overpaid_amount:', pay.overpaid_amount);
      console.log('installment_amount:', pay.installment_amount);
      console.log('all keys:', Object.keys(pay).join(', '));
    } else {
      console.log('Erro:', payResp.status);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

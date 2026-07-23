require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const integration = await prisma.mLIntegration.findFirst({ orderBy: { id: 'asc' } });
  if (!integration) { console.log('No integration'); return; }

  const token = integration.accessToken;
  const orders = ['2000017480900348', '2000017476523222'];

  for (const orderId of orders) {
    const resp = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = await resp.json();
    console.log(`\n=== ${orderId} ===`);
    console.log('total_amount:', order.total_amount);
    console.log('payments:');
    if (order.payments) {
      order.payments.forEach((p, i) => {
        console.log(`  [${i}] type:${p.payment_type} coupon_amount:${p.coupon_amount} benefit_amount:${p.benefit_amount} total_paid:${p.total_paid_amount} transaction_amount:${p.transaction_amount} status:${p.status}`);
      });
    }
    console.log('order_items[0].sale_fee:', order.order_items?.[0]?.sale_fee);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

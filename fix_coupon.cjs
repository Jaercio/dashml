const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const integration = await prisma.mLIntegration.findFirst();
  if (!integration) {
    console.log('Sem integração ML');
    return;
  }

  const accessToken = integration.accessToken;

  const sales = await prisma.sale.findMany({
    where: { status: 'PAID' },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Encontradas ${sales.length} vendas para verificar cupom`);

  let updated = 0;

  for (const sale of sales) {
    try {
      const orderResp = await fetch(
        `https://api.mercadolibre.com/orders/${sale.mlOrderId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!orderResp.ok) continue;
      const order = await orderResp.json();

      const couponAmount = order.payments?.[0]?.coupon_amount || 0;

      if (couponAmount > 0) {
        // Recalcular lucro com cupom
        const cost = sale.product?.purchasePrice || 0;
        const mlFee = order.order_items?.[0]?.sale_fee || sale.mlCommission;
        const shippingCost = sale.shippingPaid;
        const newGrossProfit = sale.salePrice - cost - mlFee - shippingCost - couponAmount;
        const newMargin = sale.salePrice > 0 ? (newGrossProfit / sale.salePrice) * 100 : 0;
        const newRoi = cost > 0 ? (newGrossProfit / cost) * 100 : 0;

        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            couponDiscount: couponAmount,
            grossProfit: newGrossProfit,
            netProfit: newGrossProfit,
            margin: newMargin,
            roi: newRoi,
          },
        });

        console.log(`${sale.mlOrderId}: cupom R$${couponAmount}, lucro R$${newGrossProfit.toFixed(2)}`);
        updated++;
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`Erro ao verificar venda ${sale.mlOrderId}:`, err.message);
    }
  }

  console.log(`\nFinalizado: ${updated} vendas com cupom atualizadas`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

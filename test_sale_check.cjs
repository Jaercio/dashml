const { PrismaClient } = require('./node_modules/.prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

(async () => {
  const integration = await prisma.mLIntegration.findFirst();
  if (!integration) { console.log('Sem integração'); return; }
  const token = integration.accessToken;

  const sales = await prisma.sale.findMany({
    where: { shippingPaid: 0, status: 'PAID' },
    include: { product: true },
  });

  console.log(`Encontradas ${sales.length} vendas para atualizar\n`);

  for (const sale of sales) {
    try {
      const resp = await fetch(`https://api.mercadolibre.com/orders/${sale.mlOrderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) { console.log(`${sale.mlOrderId}: erro ML ${resp.status}`); continue; }

      const order = await resp.json();
      if (!order.shipping?.id) { console.log(`${sale.mlOrderId}: sem shipping ID`); continue; }

      const shipResp = await fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/costs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!shipResp.ok) { console.log(`${sale.mlOrderId}: erro shipment ${shipResp.status}`); continue; }

      const shipData = await shipResp.json();
      const shippingCost = shipData.senders?.[0]?.cost || 0;
      const mlFee = order.order_items?.[0]?.sale_fee || sale.mlCommission;
      const cost = sale.product?.purchasePrice || 0;
      const profit = sale.salePrice - cost - mlFee - shippingCost;

      await prisma.sale.update({
        where: { id: sale.id },
        data: {
          shippingPaid: shippingCost,
          mlCommission: mlFee,
          grossProfit: profit,
          netProfit: profit,
          margin: sale.salePrice > 0 ? (profit / sale.salePrice) * 100 : 0,
          roi: cost > 0 ? (profit / cost) * 100 : 0,
        },
      });

      console.log(`${sale.mlOrderId}: frete R$${shippingCost}, comissão R$${mlFee}, lucro R$${profit.toFixed(2)}`);
    } catch (err) {
      console.error(`${sale.mlOrderId}: erro -`, err.message);
    }
  }

  await prisma.$disconnect();
})();

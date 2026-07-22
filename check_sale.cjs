const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const p = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' }) });
p.sale.findFirst({ where: { mlOrderId: '2000017522063370' }, include: { product: true } })
  .then(s => {
    console.log(JSON.stringify({
      salePrice: s.salePrice,
      couponDiscount: s.couponDiscount,
      productCost: s.product.purchasePrice,
      mlCommission: s.mlCommission,
      shippingPaid: s.shippingPaid,
      netProfit: s.netProfit,
      margin: s.margin
    }, null, 2));
  })
  .finally(() => p.$disconnect());

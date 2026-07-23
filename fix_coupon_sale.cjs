require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sale = await prisma.sale.findFirst({
    where: { mlOrderId: '2000017552718146' },
    include: { product: true },
  });

  if (!sale) {
    console.log('Venda não encontrada');
    return;
  }

  console.log('=== ANTES ===');
  console.log('couponDiscount:', sale.couponDiscount);
  console.log('productCost:', sale.productCost);
  console.log('quantity:', sale.quantity);
  console.log('grossProfit:', sale.grossProfit);

  const coupon = 3.41;
  const quantity = sale.quantity;
  const unitCost = sale.product?.purchasePrice || 0;
  const cost = unitCost * quantity;
  const mlFee = sale.mlCommission;
  const newGrossProfit = sale.salePrice - cost - mlFee - sale.shippingPaid - coupon;
  const newMargin = sale.salePrice > 0 ? (newGrossProfit / sale.salePrice) * 100 : 0;
  const newRoi = cost > 0 ? (newGrossProfit / cost) * 100 : 0;

  await prisma.sale.update({
    where: { id: sale.id },
    data: {
      couponDiscount: coupon,
      grossProfit: newGrossProfit,
      netProfit: newGrossProfit,
      margin: newMargin,
      roi: newRoi,
    },
  });

  console.log('');
  console.log('=== DEPOIS ===');
  const updated = await prisma.sale.findFirst({ where: { id: sale.id } });
  console.log('couponDiscount:', updated.couponDiscount);
  console.log('grossProfit:', updated.grossProfit);
  console.log('margin:', updated.margin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

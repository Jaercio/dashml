require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const orders = ['2000017480900348', '2000017476523222'];

  for (const orderId of orders) {
    const sale = await prisma.sale.findFirst({
      where: { mlOrderId: orderId },
      include: { product: true },
    });
    if (!sale) { console.log(`${orderId}: não encontrada`); continue; }

    const quantity = sale.quantity || 1;
    const cost = (sale.product?.purchasePrice || 0) * quantity;
    const mlFee = sale.mlCommission;
    const shipping = sale.shippingPaid;
    const salePrice = sale.salePrice;
    const newGrossProfit = salePrice - cost - mlFee - shipping;
    const newMargin = salePrice > 0 ? (newGrossProfit / salePrice) * 100 : 0;
    const newRoi = cost > 0 ? (newGrossProfit / cost) * 100 : 0;

    console.log(`\n=== ${orderId} ===`);
    console.log(`Antes: coupon=${sale.couponDiscount}, profit=${sale.grossProfit}, margin=${sale.margin}`);

    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        couponDiscount: 0,
        grossProfit: newGrossProfit,
        netProfit: newGrossProfit,
        margin: newMargin,
        roi: newRoi,
      },
    });

    console.log(`Depois: coupon=0, profit=${newGrossProfit.toFixed(2)}, margin=${newMargin.toFixed(1)}%`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

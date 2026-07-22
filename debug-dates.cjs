const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  console.log('Hoje (UTC):', todayStr);
  console.log('Agora (UTC):', today.toISOString());
  console.log();

  const gte = new Date(`${todayStr}T00:00:00.000Z`);
  const lte = new Date(`${todayStr}T23:59:59.999Z`);

  console.log('Filtro gte:', gte.toISOString());
  console.log('Filtro lte:', lte.toISOString());
  console.log();

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte, lte },
    },
    select: { mlOrderId: true, salePrice: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`Vendas encontradas para hoje (${sales.length}):`);
  sales.forEach(s => console.log(`  ${s.mlOrderId} | R$ ${s.salePrice} | ${s.status} | ${s.createdAt.toISOString()}`));

  console.log();
  const totalCount = await prisma.sale.count({ where: { createdAt: { gte, lte } } });
  console.log('Total:', totalCount);

  // Also check what's around midnight
  console.log('\nVendas entre 20/07 22:00 e 21/07 02:00 (UTC):');
  const borderline = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-07-20T22:00:00.000Z'),
        lte: new Date('2026-07-21T02:00:00.000Z'),
      },
    },
    select: { mlOrderId: true, salePrice: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  borderline.forEach(s => console.log(`  ${s.mlOrderId} | R$ ${s.salePrice} | ${s.status} | ${s.createdAt.toISOString()}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });

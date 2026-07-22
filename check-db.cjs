const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('Conectando ao banco Neon...\n');

  const users = await prisma.user.findMany();
  console.log(`Usuários (${users.length}):`);
  users.forEach(u => console.log(`  - ${u.name} | ${u.email} | ${u.role}`));

  const products = await prisma.product.findMany();
  console.log(`\nProdutos (${products.length}):`);
  products.forEach(p => console.log(`  - ${p.name} | SKU: ${p.sku} | Estoque: ${p.stock}`));

  const sales = await prisma.sale.findMany({ take: 5 });
  console.log(`\nVendas (mostrando ${sales.length} de ${await prisma.sale.count()}):`);
  sales.forEach(s => console.log(`  - ${s.mlOrderId} | R$ ${s.salePrice} | ${s.status}`));

  const customers = await prisma.customer.findMany({ take: 5 });
  console.log(`\nClientes (mostrando ${customers.length} de ${await prisma.customer.count()}):`);
  customers.forEach(c => console.log(`  - ${c.name} | ${c.email}`));

  await prisma.$disconnect();
  console.log('\nBanco conectado e funcionando!');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });

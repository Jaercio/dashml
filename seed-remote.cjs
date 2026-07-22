const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('Conectado ao banco remoto. Criando usuário admin...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dashml.com' },
    update: {},
    create: {
      name: 'Vendedor Admin',
      email: 'admin@dashml.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Usuário criado/atualizado:', admin.email);

  const employee = await prisma.user.upsert({
    where: { email: 'joao@dashml.com' },
    update: {},
    create: {
      name: 'João do Estoque',
      email: 'joao@dashml.com',
      passwordHash,
      role: 'EMPLOYEE',
    },
  });

  console.log('Usuário criado/atualizado:', employee.email);
  await prisma.$disconnect();
  console.log('Pronto!');
}

main().catch(e => { console.error(e); process.exit(1); });

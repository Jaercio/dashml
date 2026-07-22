const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const p = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' }) });
p.$queryRawUnsafe("SELECT netProfit FROM Sale WHERE mlOrderId = '2000017522063370'")
  .then(r => console.log('netProfit:', r[0]?.netProfit))
  .finally(() => p.$disconnect());

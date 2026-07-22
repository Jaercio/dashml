const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });
(async () => {
  const all = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  console.log("Prisma returned:", all.length, "products");
  const active = all.filter(p => p.isActive);
  console.log("Active:", active.length);
  const inactive = all.filter(p => !p.isActive);
  console.log("Inactive:", inactive.length);
  await prisma.disconnect();
})();

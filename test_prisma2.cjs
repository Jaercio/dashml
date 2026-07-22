const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });
(async () => {
  const all = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const item = all[0];
  console.log("Keys:", Object.keys(item));
  console.log("JSON:", JSON.stringify(item).substring(0, 200));
  console.log("Type:", typeof item, item.constructor?.name);
  await prisma.disconnect();
})();

const Database = require('better-sqlite3');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const sqlite = new Database('prisma/dev.db');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('Limpando banco remoto...');
  await prisma.systemLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.financialRecord.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.mLIntegration.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Usuários
  console.log('Copiando usuários...');
  const users = sqlite.prepare('SELECT * FROM User').all();
  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }
  console.log(`  ${users.length} usuários copiados.`);

  // 2. Fornecedores
  console.log('Copiando fornecedores...');
  const suppliers = sqlite.prepare('SELECT * FROM Supplier').all();
  for (const s of suppliers) {
    await prisma.supplier.create({
      data: {
        id: s.id,
        name: s.name,
        cnpj: s.cnpj,
        email: s.email,
        phone: s.phone,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }
  console.log(`  ${suppliers.length} fornecedores copiados.`);

  // 3. Clientes
  console.log('Copiando clientes...');
  const customers = sqlite.prepare('SELECT * FROM Customer').all();
  for (const c of customers) {
    await prisma.customer.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        state: c.state,
        mlCustomerId: c.mlCustomerId,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }
  console.log(`  ${customers.length} clientes copiados.`);

  // 4. Produtos
  console.log('Copiando produtos...');
  const products = sqlite.prepare('SELECT * FROM Product').all();
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        sku: p.sku,
        internalCode: p.internalCode,
        mlCode: p.mlCode,
        category: p.category,
        supplierId: p.supplierId,
        brand: p.brand,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        minPrice: p.minPrice,
        idealPrice: p.idealPrice,
        weight: p.weight,
        dimensions: p.dimensions,
        stock: p.stock,
        physicalLocation: p.physicalLocation,
        imageUrl: p.imageUrl,
        barcode: p.barcode,
        isActive: p.isActive === 1,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
  }
  console.log(`  ${products.length} produtos copiados.`);

  // 5. Movimentações de estoque
  console.log('Copiando movimentações de estoque...');
  const movements = sqlite.prepare('SELECT * FROM StockMovement').all();
  for (const m of movements) {
    await prisma.stockMovement.create({
      data: {
        id: m.id,
        productId: m.productId,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        userId: m.userId,
        createdAt: new Date(m.createdAt),
      },
    });
  }
  console.log(`  ${movements.length} movimentações copiadas.`);

  // 6. Vendas
  console.log('Copiando vendas...');
  const sales = sqlite.prepare('SELECT * FROM Sale').all();
  for (const s of sales) {
    await prisma.sale.create({
      data: {
        id: s.id,
        mlOrderId: s.mlOrderId,
        productId: s.productId,
        customerId: s.customerId,
        salePrice: s.salePrice,
        shippingReceived: s.shippingReceived,
        shippingPaid: s.shippingPaid,
        mlCommission: s.mlCommission,
        fixedFee: s.fixedFee,
        variableFee: s.variableFee,
        couponDiscount: s.couponDiscount,
        productCost: s.productCost,
        tax: s.tax,
        grossProfit: s.grossProfit,
        netProfit: s.netProfit,
        margin: s.margin,
        roi: s.roi,
        status: s.status,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }
  console.log(`  ${sales.length} vendas copiadas.`);

  // 7. Reclamações
  console.log('Copiando reclamações...');
  const complaints = sqlite.prepare('SELECT * FROM Complaint').all();
  for (const c of complaints) {
    await prisma.complaint.create({
      data: {
        id: c.id,
        mlComplaintId: c.mlComplaintId,
        saleId: c.saleId,
        productId: c.productId,
        customerId: c.customerId,
        type: c.type,
        status: c.status,
        deadline: c.deadline ? new Date(c.deadline) : null,
        reason: c.reason,
        lostValue: c.lostValue,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }
  console.log(`  ${complaints.length} reclamações copiadas.`);

  // 8. Devoluções
  console.log('Copiando devoluções...');
  const returns = sqlite.prepare('SELECT * FROM Return').all();
  for (const r of returns) {
    await prisma.return.create({
      data: {
        id: r.id,
        mlReturnId: r.mlReturnId,
        saleId: r.saleId,
        productId: r.productId,
        customerId: r.customerId,
        status: r.status,
        reason: r.reason,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      },
    });
  }
  console.log(`  ${returns.length} devoluções copiadas.`);

  // 9. Listagens
  console.log('Copiando listagens...');
  const listings = sqlite.prepare('SELECT * FROM Listing').all();
  for (const l of listings) {
    await prisma.listing.create({
      data: {
        id: l.id,
        mlItemId: l.mlItemId,
        title: l.title,
        sku: l.sku,
        price: l.price,
        status: l.status,
        listingType: l.listingType,
        visits: l.visits,
        sales: l.sales,
        conversionRate: l.conversionRate,
        stock: l.stock,
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt),
      },
    });
  }
  console.log(`  ${listings.length} listagens copiadas.`);

  // 10. Registros financeiros
  console.log('Copiando registros financeiros...');
  const financials = sqlite.prepare('SELECT * FROM FinancialRecord').all();
  for (const f of financials) {
    await prisma.financialRecord.create({
      data: {
        id: f.id,
        description: f.description,
        type: f.type,
        amount: f.amount,
        date: new Date(f.date),
        category: f.category,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      },
    });
  }
  console.log(`  ${financials.length} registros financeiros copiados.`);

  // 11. Notificações
  console.log('Copiando notificações...');
  const notifications = sqlite.prepare('SELECT * FROM Notification').all();
  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        id: n.id,
        title: n.title,
        description: n.description,
        type: n.type,
        isRead: n.isRead === 1,
        createdAt: new Date(n.createdAt),
      },
    });
  }
  console.log(`  ${notifications.length} notificações copiadas.`);

  // 12. System Logs
  console.log('Copiando logs...');
  const logs = sqlite.prepare('SELECT * FROM SystemLog').all();
  for (const l of logs) {
    await prisma.systemLog.create({
      data: {
        id: l.id,
        action: l.action,
        userId: l.userId,
        details: l.details,
        createdAt: new Date(l.createdAt),
      },
    });
  }
  console.log(`  ${logs.length} logs copiados.`);

  // 13. ML Integration
  console.log('Copiando integrações ML...');
  const integrations = sqlite.prepare('SELECT * FROM MLIntegration').all();
  for (const i of integrations) {
    await prisma.mLIntegration.create({
      data: {
        id: i.id,
        userId: i.userId,
        sellerId: i.sellerId,
        accessToken: i.accessToken,
        refreshToken: i.refreshToken,
        expiresAt: new Date(i.expiresAt),
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
        syncedAt: i.syncedAt ? new Date(i.syncedAt) : null,
      },
    });
  }
  console.log(`  ${integrations.length} integrações ML copiadas.`);

  sqlite.close();
  await prisma.$disconnect();
  console.log('\nTodos os dados copiados com sucesso!');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });

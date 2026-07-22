const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando semeadura do banco de dados...');

  // Limpar tabelas na ordem correta (dependências primeiro)
  await prisma.systemLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.financialRecord.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.mLIntegration.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Tabelas limpas.');

  // 1. CRIAR USUÁRIOS
  const adminPasswordHash = await bcrypt.hash('123456', 10);
  const employeePasswordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Vendedor Admin',
      email: 'admin@dashml.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'João do Estoque',
      email: 'joao@dashml.com',
      passwordHash: employeePasswordHash,
      role: 'EMPLOYEE',
    },
  });

  console.log('Usuários criados.');

  // 2. CRIAR FORNECEDORES
  const suppliers = [
    { name: 'Distribuidora Brasil Eletrônicos', cnpj: '12.345.678/0001-90', email: 'vendas@distribuidora.com', phone: '(11) 98888-7777' },
    { name: 'Importadora Express Ltda', cnpj: '98.765.432/0001-21', email: 'contato@importexpress.com', phone: '(11) 97777-6666' },
    { name: 'Embalagens Sul', cnpj: '45.678.901/0001-44', email: 'sul@embalagens.com', phone: '(51) 3333-2222' },
  ];

  const dbSuppliers = [];
  for (const s of suppliers) {
    const dbS = await prisma.supplier.create({ data: s });
    dbSuppliers.push(dbS);
  }
  console.log('Fornecedores criados.');

  // 3. CRIAR PRODUTOS
  const products = [
    {
      name: 'Cabo HDMI 2.0 Ultra HD 2m', sku: 'HDMI-2M-01', internalCode: 'CAB001', mlCode: 'MLB32948293',
      category: 'Cabos', brand: 'Pix', purchasePrice: 8.50, sellingPrice: 29.90, minPrice: 25.00, idealPrice: 32.00,
      weight: 0.15, dimensions: '10x15x5 cm', stock: 450, physicalLocation: 'Prateleira A1', barcode: '7891234567890',
      isActive: true, supplierId: dbSuppliers[0].id,
    },
    {
      name: 'Fone de Ouvido Bluetooth TWS Pro', sku: 'FONE-TWS-B', internalCode: 'FON002', mlCode: 'MLB43849283',
      category: 'Áudio', brand: 'Awei', purchasePrice: 42.00, sellingPrice: 119.90, minPrice: 99.00, idealPrice: 129.00,
      weight: 0.22, dimensions: '8x8x4 cm', stock: 120, physicalLocation: 'Gaveta B3', barcode: '7891234567891',
      isActive: true, supplierId: dbSuppliers[1].id,
    },
    {
      name: 'Carregador Rápido USB-C 20W', sku: 'CHARGER-20W', internalCode: 'CAR003', mlCode: 'MLB53948203',
      category: 'Carregadores', brand: 'Baseus', purchasePrice: 12.00, sellingPrice: 45.00, minPrice: 39.00, idealPrice: 49.90,
      weight: 0.08, dimensions: '6x6x4 cm', stock: 320, physicalLocation: 'Prateleira A4', barcode: '7891234567892',
      isActive: true, supplierId: dbSuppliers[1].id,
    },
    {
      name: 'Suporte Articulado para Monitor', sku: 'SUP-MON-ART', internalCode: 'SUP004', mlCode: 'MLB62948294',
      category: 'Suportes', brand: 'Elg', purchasePrice: 75.00, sellingPrice: 189.90, minPrice: 169.00, idealPrice: 199.00,
      weight: 1.80, dimensions: '30x20x10 cm', stock: 85, physicalLocation: 'Galpão Lateral 2', barcode: '7891234567893',
      isActive: true, supplierId: dbSuppliers[0].id,
    },
    {
      name: 'Teclado Mecânico RGB Switch Blue', sku: 'TEC-MEC-BL', internalCode: 'TEC005', mlCode: 'MLB72948295',
      category: 'Periféricos', brand: 'Redragon', purchasePrice: 95.00, sellingPrice: 249.90, minPrice: 220.00, idealPrice: 269.00,
      weight: 0.95, dimensions: '40x15x6 cm', stock: 50, physicalLocation: 'Prateleira C2', barcode: '7891234567894',
      isActive: true, supplierId: dbSuppliers[0].id,
    },
    {
      name: 'Mouse Gamer 6400 DPI', sku: 'MOUSE-GAMER-64', internalCode: 'MOU006', mlCode: 'MLB82948296',
      category: 'Periféricos', brand: 'Redragon', purchasePrice: 22.00, sellingPrice: 79.90, minPrice: 69.00, idealPrice: 89.90,
      weight: 0.18, dimensions: '12x7x4 cm', stock: 150, physicalLocation: 'Prateleira C3', barcode: '7891234567895',
      isActive: true, supplierId: dbSuppliers[0].id,
    },
    {
      name: 'Hub USB-C 7 em 1 Multiuso', sku: 'HUB-USBC-71', internalCode: 'HUB007', mlCode: 'MLB92948297',
      category: 'Adaptadores', brand: 'Baseus', purchasePrice: 85.00, sellingPrice: 199.90, minPrice: 180.00, idealPrice: 219.00,
      weight: 0.12, dimensions: '12x3x1 cm', stock: 10, physicalLocation: 'Gaveta B1', barcode: '7891234567896',
      isActive: true, supplierId: dbSuppliers[1].id,
    },
    {
      name: 'Ring Light de Mesa 10"', sku: 'RING-LIGHT-10', internalCode: 'RIN008', mlCode: 'MLB12948298',
      category: 'Iluminação', brand: 'RingPro', purchasePrice: 18.00, sellingPrice: 59.90, minPrice: 49.90, idealPrice: 64.90,
      weight: 0.45, dimensions: '25x25x5 cm', stock: 0, physicalLocation: 'Prateleira D1', barcode: '7891234567897',
      isActive: false, supplierId: dbSuppliers[0].id,
    },
  ];

  const dbProducts = [];
  for (const p of products) {
    const dbP = await prisma.product.create({ data: p });
    dbProducts.push(dbP);
  }
  console.log('Produtos criados: ' + dbProducts.length);

  // 4. CRIAR ANÚNCIOS (LISTINGS)
  const listings = [
    { mlItemId: 'MLB32948293', title: 'Cabo HDMI 2.0 4k Ultra HD 2 Metros Blindado Pix', price: 29.90, status: 'active', listingType: 'gold_special', visits: 1250, sales: 85, conversionRate: 6.8, stock: 450, sku: 'HDMI-2M-01' },
    { mlItemId: 'MLB43849283', title: 'Fone de Ouvido Bluetooth Sem Fio TWS Awei Pro Original', price: 119.90, status: 'active', listingType: 'gold_pro', visits: 3200, sales: 52, conversionRate: 1.6, stock: 120, sku: 'FONE-TWS-B' },
    { mlItemId: 'MLB53948203', title: 'Carregador Celular Rápido Usb-c 20w Baseus Homologado', price: 45.00, status: 'active', listingType: 'gold_special', visits: 1850, sales: 64, conversionRate: 3.4, stock: 320, sku: 'CHARGER-20W' },
    { mlItemId: 'MLB62948294', title: 'Suporte Articulado Pistão A Gás Para Monitor 17 a 35 ELG', price: 189.90, status: 'active', listingType: 'gold_pro', visits: 850, sales: 12, conversionRate: 1.4, stock: 85, sku: 'SUP-MON-ART' },
    { mlItemId: 'MLB12948298', title: 'Ring Light De Mesa Led E Suporte Celular Iluminador', price: 59.90, status: 'paused', listingType: 'gold_special', visits: 540, sales: 8, conversionRate: 1.4, stock: 0, sku: 'RING-LIGHT-10' },
  ];

  for (const l of listings) {
    await prisma.listing.create({ data: l });
  }
  console.log('Anúncios criados.');

  // 5. CRIAR CLIENTES
  const firstNames = ['Carlos', 'Ana', 'Bruno', 'Debora', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana', 'Lucas', 'Mariana', 'Otavio', 'Patricia', 'Renato', 'Sandra', 'Thiago', 'Vanessa'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Nascimento', 'Barbosa'];
  const cities = [
    { city: 'São Paulo', state: 'SP' }, { city: 'Campinas', state: 'SP' }, { city: 'Rio de Janeiro', state: 'RJ' },
    { city: 'Niterói', state: 'RJ' }, { city: 'Belo Horizonte', state: 'MG' }, { city: 'Curitiba', state: 'PR' },
    { city: 'Porto Alegre', state: 'RS' }, { city: 'Florianópolis', state: 'SC' }, { city: 'Salvador', state: 'BA' },
    { city: 'Brasília', state: 'DF' },
  ];

  const dbCustomers = [];
  for (let i = 0; i < 50; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const cityObj = cities[Math.floor(Math.random() * cities.length)];
    const customer = await prisma.customer.create({
      data: {
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@exemplo.com`,
        phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        city: cityObj.city, state: cityObj.state,
        mlCustomerId: `MLC-${100000000 + i}`,
      },
    });
    dbCustomers.push(customer);
  }
  console.log('Clientes criados: ' + dbCustomers.length);

  // 6. CRIAR VENDAS (ÚLTIMOS 30 DIAS)
  console.log('Criando histórico de vendas...');
  const now = new Date();
  const salesData = [];

  for (let i = 0; i < 120; i++) {
    const randomProduct = dbProducts[Math.floor(Math.random() * dbProducts.length)];
    const randomCustomer = dbCustomers[Math.floor(Math.random() * dbCustomers.length)];

    const saleDate = new Date();
    saleDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    saleDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    const isPremium = Math.random() > 0.4;
    const commissionPercent = isPremium ? 0.165 : 0.115;
    const mlCommission = parseFloat((randomProduct.sellingPrice * commissionPercent).toFixed(2));
    const fixedFee = randomProduct.sellingPrice < 79.00 ? 6.00 : 0.00;
    const shippingPaid = randomProduct.sellingPrice >= 79.00 ? parseFloat((18.50 + Math.random() * 8.00).toFixed(2)) : 0.00;
    const shippingReceived = randomProduct.sellingPrice < 79.00 && Math.random() > 0.7 ? 15.90 : 0.00;
    const variableFee = parseFloat((Math.random() > 0.8 ? randomProduct.sellingPrice * 0.05 : 0.00).toFixed(2));
    const productCost = randomProduct.purchasePrice;
    const tax = parseFloat((randomProduct.sellingPrice * 0.06).toFixed(2));
    const extraCosts = 1.50; // embalagem + etiqueta

    const grossProfit = parseFloat((randomProduct.sellingPrice - mlCommission - fixedFee - shippingPaid - productCost).toFixed(2));
    const netProfit = parseFloat((grossProfit - tax - extraCosts).toFixed(2));
    const margin = parseFloat(((netProfit / randomProduct.sellingPrice) * 100).toFixed(2));
    const roi = parseFloat(((netProfit / productCost) * 100).toFixed(2));

    const statusRand = Math.random();
    const status = statusRand > 0.05 ? 'PAID' : statusRand > 0.02 ? 'PENDING' : 'CANCELLED';

    const sale = await prisma.sale.create({
      data: {
        mlOrderId: `MLO-${3000000000 + i}`,
        productId: randomProduct.id, customerId: randomCustomer.id,
        salePrice: randomProduct.sellingPrice, shippingReceived, shippingPaid,
        mlCommission, fixedFee, variableFee, productCost, tax,
        grossProfit, netProfit, margin, roi, status,
        createdAt: saleDate, updatedAt: saleDate,
      },
    });
    salesData.push(sale);
  }
  console.log('Vendas criadas: ' + salesData.length);

  // 7. RECLAMAÇÕES
  console.log('Criando reclamações e devoluções...');
  const complaintsTypes = [
    { type: 'Atraso na entrega dos Correios', reason: 'A transportadora atrasou 4 dias para entregar.' },
    { type: 'Produto com defeito', reason: 'O fone de ouvido não carrega do lado esquerdo.' },
    { type: 'Item danificado no transporte', reason: 'A caixa chegou amassada e o suporte arranhado.' },
    { type: 'Produto diferente do anunciado', reason: 'O cabo HDMI enviado possui 1.5m em vez de 2m.' },
  ];

  for (let i = 0; i < 8; i++) {
    const sale = salesData[i];
    const compType = complaintsTypes[i % complaintsTypes.length];
    const cStatus = i < 5 ? 'RESOLVED' : 'OPEN';
    const lostValue = cStatus === 'RESOLVED' && Math.random() > 0.5 ? 0.00 : sale.salePrice;
    const deadline = new Date();
    deadline.setDate(now.getDate() + 3);

    await prisma.complaint.create({
      data: {
        mlComplaintId: `MLC-COMP-${50000000 + i}`,
        saleId: sale.id, productId: sale.productId, customerId: sale.customerId,
        type: compType.type, status: cStatus,
        deadline: cStatus === 'OPEN' ? deadline : null,
        reason: compType.reason, lostValue, createdAt: sale.createdAt,
      },
    });
  }

  // 8. DEVOLUÇÕES
  for (let i = 0; i < 5; i++) {
    const sale = salesData[8 + i];
    await prisma.return.create({
      data: {
        mlReturnId: `MLR-RET-${60000000 + i}`,
        saleId: sale.id, productId: sale.productId, customerId: sale.customerId,
        status: i < 3 ? 'COMPLETED' : 'PENDING',
        reason: 'Arrependimento de compra (devolução grátis)',
        createdAt: sale.createdAt,
      },
    });
  }
  console.log('Reclamações e devoluções criadas.');

  // 9. REGISTROS FINANCEIROS
  console.log('Criando registros financeiros...');
  const financialRecords = [
    { description: 'Aluguel do Galpão de Estoque', type: 'RENT', amount: 3500.00, date: now },
    { description: 'Conta de Energia Elétrica', type: 'ENERGY', amount: 480.50, date: now },
    { description: 'Link de Internet Fibra Dedicada', type: 'INTERNET', amount: 199.90, date: now },
    { description: 'Salário Funcionário - João', type: 'SALARY', amount: 2200.00, date: now },
    { description: 'Impostos Simples Nacional (Consolidado)', type: 'TAX', amount: 3450.00, date: now },
    { description: 'Compra de Caixas de Papelão', type: 'PACKAGING', amount: 850.00, date: now },
    { description: 'Compra de Bobinas de Etiqueta Térmica', type: 'LABEL', amount: 320.00, date: now },
    { description: 'Frete Extra de Devolução', type: 'EXTRA_SHIPPING', amount: 75.00, date: now },
    { description: 'Material de Limpeza e Escritório', type: 'OTHER', amount: 150.00, date: now },
  ];

  for (const r of financialRecords) {
    await prisma.financialRecord.create({ data: r });
  }
  console.log('Registros financeiros criados.');

  // 10. NOTIFICAÇÕES
  const notifications = [
    { title: 'Estoque Baixo: Hub USB-C 7 em 1', description: 'O estoque deste produto atingiu 10 unidades. Sugere-se reposição.', type: 'LOW_STOCK' },
    { title: 'Anúncio Pausado por Falta de Estoque', description: 'O anúncio MLB12948298 (Ring Light) foi pausado por estoque zerado.', type: 'PAUSED_PRODUCT' },
    { title: 'Nova Reclamação Aberta', description: 'O cliente abriu uma reclamação motivada por "Produto com defeito".', type: 'COMPLAINT' },
    { title: 'Devolução Recebida', description: 'Uma devolução chegou ao galpão e aguarda conferência.', type: 'RETURN' },
    { title: 'Integração ML Sincronizada', description: 'Todos os anúncios e vendas foram sincronizados com sucesso.', type: 'SYSTEM' },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  // 11. SYSTEM LOG
  await prisma.systemLog.create({
    data: { action: 'DATABASE_SEED', userId: admin.id, details: 'Semeadura completa para teste do Dashboard.' },
  });

  console.log('');
  console.log('=== Banco de dados semeado com sucesso! ===');
  console.log('Login: admin@dashml.com / Senha: 123456');
}

main()
  .catch((e) => {
    console.error('Erro ao semear o banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

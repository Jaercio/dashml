import { prisma } from '@/lib/prisma';

export interface StockMovementWithProduct {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  reason: string | null;
  userId: string | null;
  createdAt: string;
  product: { name: string; sku: string; stock: number };
}

export interface StockFilters {
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface StockSummary {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalIn: number;
  totalOut: number;
  movementsByType: { type: string; count: number; totalQty: number }[];
  movementsByDay: { date: string; in: number; out: number }[];
  lowStockList: { id: string; name: string; sku: string; stock: number }[];
}

export class StockRepository {
  private buildWhere(filters?: StockFilters): any {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { product: { name: { contains: filters.search } } },
        { product: { sku: { contains: filters.search } } },
        { reason: { contains: filters.search } },
      ];
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(`${filters.startDate}T00:00:00.000Z`);
      if (filters.endDate) where.createdAt.lte = new Date(`${filters.endDate}T23:59:59.999Z`);
    }

    return where;
  }

  async findAll(filters?: StockFilters): Promise<StockMovementWithProduct[]> {
    const where = this.buildWhere(filters);

    const dbMovements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, stock: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbMovements.map((m: any) => ({
      id: m.id,
      productId: m.productId,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      userId: m.userId,
      createdAt: m.createdAt.toISOString(),
      product: m.product,
    }));
  }

  async getSummary(filters?: StockFilters): Promise<StockSummary> {
    const where = this.buildWhere(filters);

    const [movements, products, movementsByType, movementsByDay, lowStockList] = await Promise.all([
      prisma.stockMovement.findMany({ where, select: { type: true, quantity: true } }),
      prisma.product.findMany({ select: { stock: true, isActive: true } }),
      prisma.stockMovement.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { quantity: true },
      }),
      prisma.$queryRawUnsafe(`
        SELECT
          strftime('%Y-%m-%d', createdAt) as date,
          SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END) as "in",
          SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) as "out"
        FROM StockMovement
        WHERE createdAt >= datetime('now', '-30 days')
        GROUP BY strftime('%Y-%m-%d', createdAt)
        ORDER BY date ASC
      `),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        select: { id: true, name: true, sku: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
    ]);

    const totalProducts = products.filter((p) => p.isActive).length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockProducts = products.filter((p) => p.isActive && p.stock > 0 && p.stock <= 5).length;
    const outOfStockProducts = products.filter((p) => p.isActive && p.stock === 0).length;
    const totalIn = movements.filter((m) => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = movements.filter((m) => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);

    return {
      totalProducts,
      totalStock,
      lowStockProducts,
      outOfStockProducts,
      totalIn,
      totalOut,
      movementsByType: movementsByType.map((m: any) => ({
        type: m.type,
        count: m._count.id,
        totalQty: m._sum.quantity || 0,
      })),
      movementsByDay: (movementsByDay as any[]).map((d: any) => ({
        date: d.date,
        in: d.in || 0,
        out: d.out || 0,
      })),
      lowStockList,
    };
  }

  async create(data: { productId: string; type: string; quantity: number; reason?: string; userId?: string }) {
    const movement = await prisma.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason || null,
        userId: data.userId || null,
      },
    });

    const stockChange = data.type === 'IN' ? data.quantity : -data.quantity;
    await prisma.product.update({
      where: { id: data.productId },
      data: { stock: { increment: stockChange } },
    });

    return movement;
  }
}

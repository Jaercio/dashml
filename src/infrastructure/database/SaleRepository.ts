import { prisma } from '@/lib/prisma';

export interface SaleWithDetails {
  id: string;
  mlOrderId: string;
  salePrice: number;
  shippingReceived: number;
  shippingPaid: number;
  mlCommission: number;
  fixedFee: number;
  variableFee: number;
  couponDiscount: number;
  productCost: number;
  tax: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  roi: number;
  status: string;
  createdAt: string;
  product: { name: string; sku: string };
  customer: { name: string };
}

export interface SaleFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  totalCosts: number;
  totalContributionMargin: number;
  avgMargin: number;
  avgROI: number;
  avgTicket: number;
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  profitByDay: { date: string; profit: number; revenue: number; count: number }[];
  profitByProduct: { name: string; totalProfit: number; totalSales: number; avgMargin: number }[];
  profitByStatus: { status: string; count: number; total: number }[];
}

export class SaleRepository {
  private buildWhere(filters?: SaleFilters): any {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { mlOrderId: { contains: filters.search } },
        { product: { name: { contains: filters.search } } },
        { customer: { name: { contains: filters.search } } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const [y, m, d] = filters.startDate.split('-').map(Number);
        where.createdAt.gte = new Date(y, m - 1, d, 0, 0, 0);
      }
      if (filters.endDate) {
        const [y, m, d] = filters.endDate.split('-').map(Number);
        where.createdAt.lte = new Date(y, m - 1, d, 23, 59, 59);
      }
    }

    return where;
  }

  async findAll(filters?: SaleFilters): Promise<SaleWithDetails[]> {
    const where = this.buildWhere(filters);

    const dbSales = await prisma.sale.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, purchasePrice: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbSales.map((s: any) => {
      const currentCost = s.product?.purchasePrice || 0;
      const mlFees = s.mlCommission + s.fixedFee + s.variableFee;
      const couponDiscount = s.couponDiscount || 0;
      const grossProfit = s.salePrice - currentCost - mlFees - s.shippingPaid - couponDiscount;
      const netProfit = grossProfit - s.tax;
      const margin = s.salePrice > 0 ? (netProfit / s.salePrice) * 100 : 0;
      const roi = currentCost > 0 ? (netProfit / currentCost) * 100 : 0;

      return {
        id: s.id,
        mlOrderId: s.mlOrderId,
        salePrice: s.salePrice,
        shippingReceived: s.shippingReceived,
        shippingPaid: s.shippingPaid,
        mlCommission: s.mlCommission,
        fixedFee: s.fixedFee,
        variableFee: s.variableFee,
        couponDiscount: s.couponDiscount,
        productCost: currentCost,
        tax: s.tax,
        grossProfit,
        netProfit,
        margin,
        roi,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        product: { name: s.product.name, sku: s.product.sku },
        customer: s.customer,
      };
    });
  }

  async getSummary(filters?: SaleFilters): Promise<SalesSummary> {
    const where = this.buildWhere(filters);

    const [sales, profitByDay, profitByProduct, profitByStatus] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          salePrice: true,
          shippingPaid: true,
          mlCommission: true,
          fixedFee: true,
          variableFee: true,
          couponDiscount: true,
          tax: true,
          status: true,
          createdAt: true,
          product: { select: { purchasePrice: true } },
        },
      }),
      prisma.$queryRawUnsafe(`
        SELECT
          strftime('%Y-%m-%d', s.createdAt) as date,
          SUM(s.salePrice) as revenue,
          SUM(s.salePrice - (p.purchasePrice * 1.0) - s.mlCommission - s.fixedFee - s.variableFee - s.couponDiscount - s.shippingPaid - s.tax) as profit,
          COUNT(*) as count
        FROM Sale s
        JOIN Product p ON s.productId = p.id
        WHERE s.createdAt >= datetime('now', '-30 days') AND s.status = 'PAID'
        GROUP BY strftime('%Y-%m-%d', s.createdAt)
        ORDER BY date ASC
      `),
      prisma.$queryRawUnsafe(`
        SELECT
          p.name,
          SUM(s.salePrice - (p.purchasePrice * 1.0) - s.mlCommission - s.fixedFee - s.variableFee - s.couponDiscount - s.shippingPaid - s.tax) as totalProfit,
          COUNT(*) as totalSales,
          CASE WHEN SUM(s.salePrice) > 0
            THEN (SUM(s.salePrice - (p.purchasePrice * 1.0) - s.mlCommission - s.fixedFee - s.variableFee - s.couponDiscount - s.shippingPaid - s.tax)) * 100.0 / SUM(s.salePrice)
            ELSE 0 END as avgMargin
        FROM Sale s
        JOIN Product p ON s.productId = p.id
        WHERE s.status = 'PAID'
        GROUP BY s.productId
        ORDER BY totalProfit DESC
        LIMIT 10
      `),
      prisma.sale.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { salePrice: true },
      }),
    ]);

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + s.salePrice, 0);
    const totalCosts = sales.reduce((sum: number, s: any) => sum + (s.product?.purchasePrice || 0), 0);
    const totalShippingPaid = sales.reduce((sum: number, s: any) => sum + (s.shippingPaid || 0), 0);
    const totalCouponDiscount = sales.reduce((sum: number, s: any) => sum + (s.couponDiscount || 0), 0);
    const totalContributionMargin = totalRevenue - totalCosts - totalShippingPaid - totalCouponDiscount;
    const totalMLFees = sales.reduce((sum: number, s: any) => sum + s.mlCommission + s.fixedFee + s.variableFee, 0);
    const totalTaxes = sales.reduce((sum: number, s: any) => sum + s.tax, 0);
    const totalGrossProfit = totalContributionMargin - totalMLFees;
    const totalNetProfit = totalGrossProfit - totalTaxes;
    const avgMargin = totalSales > 0 ? (totalContributionMargin / totalRevenue) * 100 : 0;
    const avgROI = totalCosts > 0 ? (totalNetProfit / totalCosts) * 100 : 0;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const totalPaid = sales.filter((s) => s.status === 'PAID').length;
    const totalPending = sales.filter((s) => s.status === 'PENDING').length;
    const totalCancelled = sales.filter((s) => s.status === 'CANCELLED').length;

    return {
      totalSales,
      totalRevenue,
      totalGrossProfit: parseFloat(totalGrossProfit.toFixed(2)),
      totalNetProfit: parseFloat(totalNetProfit.toFixed(2)),
      totalCosts: parseFloat(totalCosts.toFixed(2)),
      totalContributionMargin: parseFloat(totalContributionMargin.toFixed(2)),
      avgMargin: parseFloat(avgMargin.toFixed(2)),
      avgROI: parseFloat(avgROI.toFixed(2)),
      avgTicket: parseFloat(avgTicket.toFixed(2)),
      totalPaid,
      totalPending,
      totalCancelled,
      profitByDay: (profitByDay as any[]).map((d: any) => ({
        date: d.date,
        profit: parseFloat((d.profit || 0).toFixed(2)),
        revenue: parseFloat((d.revenue || 0).toFixed(2)),
        count: Number(d.count) || 0,
      })),
      profitByProduct: (profitByProduct as any[]).map((p: any) => ({
        name: p.name,
        totalProfit: parseFloat((p.totalProfit || 0).toFixed(2)),
        totalSales: Number(p.totalSales) || 0,
        avgMargin: parseFloat((p.avgMargin || 0).toFixed(2)),
      })),
      profitByStatus: profitByStatus.map((s: any) => ({
        status: s.status,
        count: s._count.id,
        total: s._sum.salePrice || 0,
      })),
    };
  }
}

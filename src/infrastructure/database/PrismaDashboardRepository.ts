import { prisma } from '@/lib/prisma';
import { IDashboardRepository, DashboardStats } from '@/core/repositories/IDashboardRepository';

export class PrismaDashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    // Período: últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // --- VENDAS ---
    const allSales = await prisma.sale.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: { product: { select: { name: true, purchasePrice: true } }, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const paidSales = allSales.filter((s: any) => s.status === 'PAID');
    const pendingSales = allSales.filter((s: any) => s.status === 'PENDING');
    const cancelledSales = allSales.filter((s: any) => s.status === 'CANCELLED');

    const totalRevenue = paidSales.reduce((sum: number, s: any) => sum + s.salePrice, 0);
    const totalCosts = paidSales.reduce((sum: number, s: any) => sum + (s.product?.purchasePrice || 0), 0);
    const totalShippingPaid = paidSales.reduce((sum: number, s: any) => sum + (s.shippingPaid || 0), 0);
    const totalCouponDiscount = paidSales.reduce((sum: number, s: any) => sum + (s.couponDiscount || 0), 0);
    const totalContributionMargin = totalRevenue - totalCosts - totalShippingPaid - totalCouponDiscount;
    const totalMLFees = paidSales.reduce((sum: number, s: any) => sum + s.mlCommission + s.fixedFee + s.variableFee, 0);
    const totalTaxes = paidSales.reduce((sum: number, s: any) => sum + s.tax, 0);
    const totalGrossProfit = totalContributionMargin - totalMLFees;
    const totalNetProfit = totalGrossProfit - totalTaxes;
    const avgTicket = paidSales.length > 0 ? totalRevenue / paidSales.length : 0;
    const avgMargin = paidSales.length > 0 ? (totalContributionMargin / totalRevenue) * 100 : 0;
    const avgROI = totalCosts > 0 ? (totalNetProfit / totalCosts) * 100 : 0;

    // --- VENDAS POR DIA (para gráfico) ---
    const salesByDayMap: Record<string, { revenue: number; profit: number; count: number }> = {};
    paidSales.forEach((s: any) => {
      const dateKey = new Date(s.createdAt).toISOString().split('T')[0];
      if (!salesByDayMap[dateKey]) {
        salesByDayMap[dateKey] = { revenue: 0, profit: 0, count: 0 };
      }
      salesByDayMap[dateKey].revenue += s.salePrice;
      salesByDayMap[dateKey].profit += s.netProfit;
      salesByDayMap[dateKey].count += 1;
    });

    const salesByDay = Object.entries(salesByDayMap)
      .map(([date, data]) => ({
        date: date.split('-').slice(1).join('/'), // MM/DD format
        revenue: parseFloat(data.revenue.toFixed(2)),
        profit: parseFloat(data.profit.toFixed(2)),
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- PRODUTOS RANKING ---
    const productStatsMap: Record<string, { name: string; totalSold: number; revenue: number; totalProfit: number; totalCost: number }> = {};
    paidSales.forEach((s: any) => {
      const pid = s.productId;
      if (!productStatsMap[pid]) {
        productStatsMap[pid] = { name: s.product.name, totalSold: 0, revenue: 0, totalProfit: 0, totalCost: 0 };
      }
      productStatsMap[pid].totalSold += 1;
      productStatsMap[pid].revenue += s.salePrice;
      const cost = s.product?.purchasePrice || 0;
      productStatsMap[pid].totalCost += cost;
      productStatsMap[pid].totalProfit += s.salePrice - cost;
    });

    const productStats = Object.values(productStatsMap).map((p: any) => ({
      ...p,
      avgMargin: p.revenue > 0 ? parseFloat(((p.totalProfit / p.revenue) * 100).toFixed(2)) : 0,
      revenue: parseFloat(p.revenue.toFixed(2)),
      totalProfit: parseFloat(p.totalProfit.toFixed(2)),
    }));

    const topSellingProducts = [...productStats].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
    const mostProfitableProducts = [...productStats].sort((a, b) => b.avgMargin - a.avgMargin).slice(0, 5);
    const leastProfitableProducts = [...productStats].sort((a, b) => a.avgMargin - b.avgMargin).slice(0, 5);

    // --- ESTOQUE ---
    const products = await prisma.product.findMany();
    const totalStock = products.reduce((sum: number, p: any) => sum + p.stock, 0);
    const totalActiveProducts = products.filter((p: any) => p.isActive).length;
    const totalPausedProducts = products.filter((p: any) => !p.isActive).length;
    const totalOutOfStockProducts = products.filter((p: any) => p.stock === 0).length;
    const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= 15).length;

    // --- RECLAMAÇÕES ---
    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: { product: { select: { name: true } }, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const openComplaints = complaints.filter((c: any) => c.status === 'OPEN').length;
    const totalLostValue = complaints.reduce((sum: number, c: any) => sum + c.lostValue, 0);

    // --- DEVOLUÇÕES ---
    const returns = await prisma.return.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // --- DESPESAS ---
    const financialRecords = await prisma.financialRecord.findMany();
    const totalOperationalExpenses = financialRecords.reduce((sum: number, r: any) => sum + r.amount, 0);

    const expensesByCategory: Record<string, number> = {};
    financialRecords.forEach((r: any) => {
      const cat = r.type;
      if (!expensesByCategory[cat]) {
        expensesByCategory[cat] = 0;
      }
      expensesByCategory[cat] += r.amount;
    });

    const expensesByCategoryArr = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category: categoryLabel(category),
      amount: parseFloat(amount.toFixed(2)),
    }));

    // --- ATIVIDADES RECENTES ---
    const recentSales = allSales.slice(0, 10).map((s: any) => ({
      id: s.mlOrderId,
      product: s.product.name,
      customer: s.customer.name,
      price: s.salePrice,
      profit: s.netProfit,
      date: new Date(s.createdAt).toLocaleDateString('pt-BR'),
      status: s.status,
    }));

    const recentComplaints = complaints.slice(0, 5).map((c: any) => ({
      id: c.mlComplaintId || c.id,
      type: c.type,
      customer: c.customer.name,
      product: c.product.name,
      status: c.status,
      date: new Date(c.createdAt).toLocaleDateString('pt-BR'),
    }));

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalGrossProfit: parseFloat(totalGrossProfit.toFixed(2)),
      totalNetProfit: parseFloat(totalNetProfit.toFixed(2)),
      totalCosts: parseFloat(totalCosts.toFixed(2)),
      totalMLFees: parseFloat(totalMLFees.toFixed(2)),
      totalTaxes: parseFloat(totalTaxes.toFixed(2)),
      totalContributionMargin: parseFloat(totalContributionMargin.toFixed(2)),
      avgTicket: parseFloat(avgTicket.toFixed(2)),
      avgMargin: parseFloat(avgMargin.toFixed(2)),
      avgROI: parseFloat(avgROI.toFixed(2)),
      totalSales: allSales.length,
      totalPaidSales: paidSales.length,
      totalPendingSales: pendingSales.length,
      totalCancelledSales: cancelledSales.length,
      totalStock,
      totalActiveProducts,
      totalPausedProducts,
      totalOutOfStockProducts,
      lowStockProducts,
      totalComplaints: complaints.length,
      openComplaints,
      totalReturns: returns.length,
      totalLostValue: parseFloat(totalLostValue.toFixed(2)),
      totalOperationalExpenses: parseFloat(totalOperationalExpenses.toFixed(2)),
      salesByDay,
      expensesByCategory: expensesByCategoryArr,
      topSellingProducts,
      mostProfitableProducts,
      leastProfitableProducts,
      recentSales,
      recentComplaints,
    };
  }
}

function categoryLabel(type: string): string {
  const labels: Record<string, string> = {
    RENT: 'Aluguel',
    ENERGY: 'Energia',
    INTERNET: 'Internet',
    SALARY: 'Salários',
    TAX: 'Impostos',
    PACKAGING: 'Embalagens',
    LABEL: 'Etiquetas',
    EXTRA_SHIPPING: 'Frete Extra',
    OTHER: 'Outros',
  };
  return labels[type] || type;
}

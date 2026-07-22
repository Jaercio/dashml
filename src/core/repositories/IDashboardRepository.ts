export interface DashboardStats {
  // KPIs financeiros
  totalRevenue: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  totalCosts: number;
  totalMLFees: number;
  totalTaxes: number;
  totalContributionMargin: number;
  avgTicket: number;
  avgMargin: number;
  avgROI: number;

  // Volumes
  totalSales: number;
  totalPaidSales: number;
  totalPendingSales: number;
  totalCancelledSales: number;

  // Estoque
  totalStock: number;
  totalActiveProducts: number;
  totalPausedProducts: number;
  totalOutOfStockProducts: number;
  lowStockProducts: number;

  // Qualidade
  totalComplaints: number;
  openComplaints: number;
  totalReturns: number;
  totalLostValue: number;

  // Despesas operacionais
  totalOperationalExpenses: number;

  // Gráficos - Vendas por dia
  salesByDay: { date: string; revenue: number; profit: number; count: number }[];

  // Gráficos - Despesas por categoria
  expensesByCategory: { category: string; amount: number }[];

  // Rankings
  topSellingProducts: { name: string; totalSold: number; revenue: number }[];
  mostProfitableProducts: { name: string; avgMargin: number; totalProfit: number }[];
  leastProfitableProducts: { name: string; avgMargin: number; totalProfit: number }[];

  // Últimas atividades
  recentSales: { id: string; product: string; customer: string; price: number; profit: number; date: string; status: string }[];
  recentComplaints: { id: string; type: string; customer: string; product: string; status: string; date: string }[];
}

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
}

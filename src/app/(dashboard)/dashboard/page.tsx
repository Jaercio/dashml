'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle,
  BarChart3, Percent, ArrowUpRight, ArrowDownRight, Loader2, RotateCcw,
  Wallet, Receipt, Truck, AlertOctagon, Boxes
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardStats {
  totalRevenue: number; totalGrossProfit: number; totalNetProfit: number;
  totalCosts: number; totalMLFees: number; totalTaxes: number;
  totalContributionMargin: number;
  avgTicket: number; avgMargin: number; avgROI: number;
  totalSales: number; totalPaidSales: number; totalPendingSales: number; totalCancelledSales: number;
  totalStock: number; totalActiveProducts: number; totalPausedProducts: number;
  totalOutOfStockProducts: number; lowStockProducts: number;
  totalComplaints: number; openComplaints: number; totalReturns: number; totalLostValue: number;
  totalOperationalExpenses: number;
  salesByDay: { date: string; revenue: number; profit: number; count: number }[];
  expensesByCategory: { category: string; amount: number }[];
  topSellingProducts: { name: string; totalSold: number; revenue: number }[];
  mostProfitableProducts: { name: string; avgMargin: number; totalProfit: number }[];
  leastProfitableProducts: { name: string; avgMargin: number; totalProfit: number }[];
  recentSales: { id: string; product: string; customer: string; price: number; profit: number; date: string; status: string }[];
  recentComplaints: { id: string; type: string; customer: string; product: string; status: string; date: string }[];
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#4f46e5', '#4338ca', '#3730a3'];

function formatBRL(value: number | null | undefined): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
    PENDING: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
    CANCELLED: 'bg-red-950/60 border-red-800/50 text-red-400',
    OPEN: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
    RESOLVED: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
  };
  const labels: Record<string, string> = {
    PAID: 'Pago', PENDING: 'Pendente', CANCELLED: 'Cancelado', OPEN: 'Aberta', RESOLVED: 'Resolvida',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {labels[status] || status}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 font-medium mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {formatBRL(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStats(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando métricas do ERP...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{error || 'Dados indisponíveis.'}</p>
          <button onClick={fetchStats} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Visão geral dos últimos 30 dias</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer">
          <RotateCcw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      {/* KPI Cards Row 1: Financial */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KPICard title="Valor Bruto" value={formatBRL(stats.totalRevenue)} icon={DollarSign} iconColor="text-emerald-400" sub={`${stats.totalPaidSales} vendas pagas`} />
        <KPICard title="Margem de Contribuição" value={formatBRL(stats.totalContributionMargin)} icon={TrendingUp} iconColor="text-indigo-400" sub={`Receita - Custo mercadoria`} trend={stats.totalContributionMargin > 0 ? 'up' : 'down'} />
        <KPICard title="Lucro Líquido" value={formatBRL(stats.totalNetProfit)} icon={Percent} iconColor="text-cyan-400" sub={`Margem: ${stats.avgMargin.toFixed(1)}%`} trend={stats.totalNetProfit > 0 ? 'up' : 'down'} />
        <KPICard title="Taxas ML & Impostos" value={formatBRL(stats.totalMLFees + stats.totalTaxes)} icon={Receipt} iconColor="text-amber-400" sub={`ML: ${formatBRL(stats.totalMLFees)} · Imp: ${formatBRL(stats.totalTaxes)}`} trend="down" />
        <KPICard title="Despesas Operacionais" value={formatBRL(stats.totalOperationalExpenses)} icon={Wallet} iconColor="text-rose-400" sub={`Custo mercadoria: ${formatBRL(stats.totalCosts)}`} trend="down" />
      </div>

      {/* KPI Cards Row 2: Volume & Quality */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KPICard title="Total de Vendas" value={String(stats.totalSales)} icon={BarChart3} iconColor="text-blue-400" sub={`${stats.totalPendingSales} pendente · ${stats.totalCancelledSales} cancelada`} />
        <KPICard title="Estoque Total" value={`${stats.totalStock} un.`} icon={Boxes} iconColor="text-teal-400" sub={`${stats.totalActiveProducts} ativos · ${stats.totalPausedProducts} pausados`} />
        <KPICard title="Sem Estoque" value={String(stats.totalOutOfStockProducts)} icon={Package} iconColor="text-orange-400" sub={`${stats.lowStockProducts} com estoque baixo`} trend={stats.totalOutOfStockProducts > 0 ? 'down' : 'up'} />
        <KPICard title="Reclamações" value={String(stats.totalComplaints)} icon={AlertOctagon} iconColor="text-red-400" sub={`${stats.openComplaints} em aberto`} trend={stats.openComplaints > 0 ? 'down' : 'up'} />
        <KPICard title="Devoluções" value={String(stats.totalReturns)} icon={Truck} iconColor="text-pink-400" sub={`Prejuízo: ${formatBRL(stats.totalLostValue)}`} trend="down" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Area Chart */}
        <Card className="glassmorphism border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Receita & Lucro por Dia</CardTitle>
            <CardDescription>Evolução financeira dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="#6366f1" fill="url(#gradRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Lucro" stroke="#22c55e" fill="url(#gradProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Pie Chart */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição dos custos operacionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.expensesByCategory} dataKey="amount" nameKey="category" cx="50%" cy="45%" outerRadius={85} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                    {stats.expensesByCategory.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatBRL(Number(value))} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart: Top Selling */}
      <Card className="glassmorphism border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Produtos Mais Vendidos</CardTitle>
          <CardDescription>Top 5 produtos por quantidade vendida nos últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSellingProducts} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fill: '#d4d4d8', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" name="Receita" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Profitable */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Mais Lucrativos
            </CardTitle>
            <CardDescription>Ranking por margem líquida média</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left py-2 font-medium">Produto</th>
                    <th className="text-right py-2 font-medium">Margem</th>
                    <th className="text-right py-2 font-medium">Lucro Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostProfitableProducts.map((p, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 text-zinc-200 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold">{p.avgMargin.toFixed(1)}%</td>
                      <td className="py-2.5 text-right text-zinc-300">{formatBRL(p.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Least Profitable */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" /> Menos Lucrativos
            </CardTitle>
            <CardDescription>Produtos com menor margem (atenção requerida)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left py-2 font-medium">Produto</th>
                    <th className="text-right py-2 font-medium">Margem</th>
                    <th className="text-right py-2 font-medium">Lucro Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leastProfitableProducts.map((p, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 text-zinc-200 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right text-red-400 font-bold">{p.avgMargin.toFixed(1)}%</td>
                      <td className="py-2.5 text-right text-zinc-300">{formatBRL(p.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Últimas Vendas</CardTitle>
            <CardDescription>10 vendas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left py-2 font-medium">Produto</th>
                    <th className="text-left py-2 font-medium">Cliente</th>
                    <th className="text-right py-2 font-medium">Preço</th>
                    <th className="text-right py-2 font-medium">Lucro</th>
                    <th className="text-center py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSales.map((s, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 text-zinc-200 font-medium max-w-[140px] truncate">{s.product}</td>
                      <td className="py-2.5 text-zinc-400 max-w-[100px] truncate">{s.customer}</td>
                      <td className="py-2.5 text-right text-zinc-300">{formatBRL(s.price)}</td>
                      <td className={`py-2.5 text-right font-semibold ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatBRL(s.profit)}
                      </td>
                      <td className="py-2.5 text-center"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Complaints */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Últimas Reclamações</CardTitle>
            <CardDescription>5 reclamações mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left py-2 font-medium">Tipo</th>
                    <th className="text-left py-2 font-medium">Cliente</th>
                    <th className="text-left py-2 font-medium">Produto</th>
                    <th className="text-center py-2 font-medium">Status</th>
                    <th className="text-right py-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentComplaints.map((c, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 text-zinc-200 font-medium max-w-[120px] truncate">{c.type}</td>
                      <td className="py-2.5 text-zinc-400 max-w-[90px] truncate">{c.customer}</td>
                      <td className="py-2.5 text-zinc-400 max-w-[100px] truncate">{c.product}</td>
                      <td className="py-2.5 text-center"><StatusBadge status={c.status} /></td>
                      <td className="py-2.5 text-right text-zinc-500">{c.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- KPI Card Component ---
function KPICard({ title, value, icon: Icon, iconColor, sub, trend }: {
  title: string; value: string; icon: any; iconColor: string; sub: string; trend?: 'up' | 'down';
}) {
  return (
    <Card className="glassmorphism border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="pt-5 pb-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</span>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-xl font-extrabold text-white leading-none">{value}</span>
          {trend && (
            trend === 'up'
              ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
          )}
        </div>
        <p className="text-[10px] text-zinc-500 mt-1.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DollarSign, Search, Loader2, AlertTriangle, RotateCcw,
  ShoppingCart, Package, Receipt, Truck, TrendingUp, TrendingDown
} from 'lucide-react';

interface SaleRecord {
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

function formatBRL(value: number | null | undefined): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateTime(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
    PENDING: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
    CANCELLED: 'bg-red-950/60 border-red-800/50 text-red-400',
  };
  const labels: Record<string, string> = {
    PAID: 'Pago', PENDING: 'Pendente', CANCELLED: 'Cancelado',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00');
        params.set('startDate', start.toISOString());
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59');
        params.set('endDate', end.toISOString());
      }

      const res = await fetch(`/api/sales?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vendas.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateStart, dateEnd]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const totalRevenue = sales.reduce((sum, s) => sum + (s.salePrice ?? 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.productCost ?? 0), 0);
  const totalCommission = sales.reduce((sum, s) => sum + (s.mlCommission ?? 0), 0);
  const totalFixedFee = sales.reduce((sum, s) => sum + (s.fixedFee ?? 0), 0);
  const totalShippingPaid = sales.reduce((sum, s) => sum + (s.shippingPaid ?? 0), 0);
  const totalShippingReceived = sales.reduce((sum, s) => sum + (s.shippingReceived ?? 0), 0);
  const totalCouponDiscount = sales.reduce((sum, s) => sum + (s.couponDiscount ?? 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.netProfit ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchSales} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Vendas</h2>
        <p className="text-sm text-zinc-400 mt-1">Detalhamento de cada venda com taxas e lucro</p>
      </div>

      {/* Filters */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por pedido, produto, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
            >
              <option value="">Todos status</option>
              <option value="PAID">Pago</option>
              <option value="PENDING">Pendente</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors"
            />
            <span className="text-zinc-600 text-xs">até</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-8">
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Vendas</span>
              <ShoppingCart className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <span className="text-lg font-extrabold text-white leading-none">{sales.length}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Valor Bruto</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-lg font-extrabold text-emerald-400 leading-none">{formatBRL(totalRevenue)}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Cupons</span>
              <Receipt className="h-3.5 w-3.5 text-pink-400" />
            </div>
            <span className="text-lg font-extrabold text-pink-400 leading-none">-{formatBRL(totalCouponDiscount)}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Custo Produtos</span>
              <Package className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-lg font-extrabold text-red-400 leading-none">{formatBRL(totalCost)}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Comissão ML</span>
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-lg font-extrabold text-amber-400 leading-none">{formatBRL(totalCommission)}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Taxa Fixa ML</span>
              <Receipt className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <span className="text-lg font-extrabold text-orange-400 leading-none">{formatBRL(totalFixedFee)}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Frete Pago (ML)</span>
              <Truck className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-lg font-extrabold text-amber-400 leading-none">{formatBRL(totalShippingPaid)}</span>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Lucro Líquido</span>
              {totalProfit >= 0
                ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              }
            </div>
            <span className={`text-lg font-extrabold leading-none ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatBRL(totalProfit)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left py-3 px-3 font-medium">Data</th>
                  <th className="text-left py-3 px-3 font-medium">Pedido</th>
                  <th className="text-left py-3 px-3 font-medium">Produto</th>
                  <th className="text-right py-3 px-3 font-medium">Venda</th>
                  <th className="text-right py-3 px-3 font-medium">Cupom</th>
                  <th className="text-right py-3 px-3 font-medium">Custo</th>
                  <th className="text-right py-3 px-3 font-medium">Comissão</th>
                  <th className="text-right py-3 px-3 font-medium">Taxa Fixa</th>
                  <th className="text-right py-3 px-3 font-medium">Frete ML</th>
                  <th className="text-right py-3 px-3 font-medium">Lucro</th>
                  <th className="text-center py-3 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-zinc-500">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-zinc-400">{formatDateTime(sale.createdAt)}</td>
                        <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px]">{sale.mlOrderId}</td>
                        <td className="py-2.5 px-3 text-zinc-200 font-medium max-w-[160px] truncate" title={sale.product.name}>
                          {sale.product.name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-200 font-semibold">{formatBRL(sale.salePrice)}</td>
                        <td className="py-2.5 px-3 text-right text-pink-400">{(sale.couponDiscount ?? 0) > 0 ? `-${formatBRL(sale.couponDiscount)}` : '-'}</td>
                        <td className="py-2.5 px-3 text-right text-red-400">-{formatBRL(sale.productCost)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-400">-{formatBRL(sale.mlCommission)}</td>
                        <td className="py-2.5 px-3 text-right text-orange-400">-{formatBRL(sale.fixedFee)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-300">-{formatBRL(sale.shippingPaid)}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${(sale.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatBRL(sale.netProfit)}
                        </td>
                        <td className="py-2.5 px-3 text-center"><StatusBadge status={sale.status} /></td>
                      </tr>
                  ))
                )}
              </tbody>
              {sales.length > 0 && (
                <tfoot>
                  <tr className="border-t border-zinc-700 bg-zinc-900/60">
                    <td colSpan={3} className="py-3 px-3 text-zinc-400 font-bold">Total</td>
                    <td className="py-3 px-3 text-right text-zinc-200 font-bold">{formatBRL(totalRevenue)}</td>
                    <td className="py-3 px-3 text-right text-pink-400 font-bold">-{formatBRL(totalCouponDiscount)}</td>
                    <td className="py-3 px-3 text-right text-red-400 font-bold">-{formatBRL(totalCost)}</td>
                    <td className="py-3 px-3 text-right text-amber-400 font-bold">-{formatBRL(totalCommission)}</td>
                    <td className="py-3 px-3 text-right text-orange-400 font-bold">-{formatBRL(totalFixedFee)}</td>
                    <td className="py-3 px-3 text-right text-amber-300 font-bold">-{formatBRL(totalShippingPaid)}</td>
                    <td className={`py-3 px-3 text-right font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatBRL(totalProfit)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

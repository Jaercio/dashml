'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Package, Plus, Search, Loader2, AlertTriangle, RotateCcw,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Box, AlertOctagon, TrendingDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StockMovement {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  reason: string | null;
  userId: string | null;
  createdAt: string;
  product: { name: string; sku: string; stock: number };
}

interface StockSummary {
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

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { icon: any; color: string; label: string }> = {
    IN: { icon: ArrowDownCircle, color: 'text-emerald-400', label: 'Entrada' },
    OUT: { icon: ArrowUpCircle, color: 'text-red-400', label: 'Saída' },
    INVENTORY: { icon: RefreshCw, color: 'text-amber-400', label: 'Inventário' },
  };
  const cfg = config[type] || config.IN;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ productId: '', type: 'IN', quantity: 1, reason: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);

      const [movRes, sumRes, prodRes] = await Promise.all([
        fetch(`/api/stock?${params.toString()}`),
        fetch(`/api/stock?summary=true&${params.toString()}`),
        fetch('/api/products'),
      ]);

      const movData = await movRes.json();
      const sumData = await sumRes.json();
      const prodData = await prodRes.json();

      if (movData.success) setMovements(movData.data);
      if (sumData.success) setSummary(sumData.data);
      if (prodData.success) setProducts(prodData.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de estoque.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!formData.productId || formData.quantity <= 0) {
      alert('Selecione um produto e informe uma quantidade válida.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, quantity: Number(formData.quantity) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowModal(false);
      setFormData({ productId: '', type: 'IN', quantity: 1, reason: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando estoque...</p>
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
          <button onClick={fetchData} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Controle de Estoque</h2>
          <p className="text-sm text-zinc-400 mt-1">Movimentações e inventário de produtos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nova Movimentação
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="glassmorphism border-zinc-800">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Estoque Total</span>
                <Box className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-xl font-extrabold text-white leading-none">{summary.totalStock} un.</span>
              <p className="text-[10px] text-zinc-500 mt-1.5">{summary.totalProducts} produtos</p>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-zinc-800">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Entradas (30d)</span>
                <ArrowDownCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-xl font-extrabold text-emerald-400 leading-none">+{summary.totalIn}</span>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-zinc-800">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Saídas (30d)</span>
                <ArrowUpCircle className="h-4 w-4 text-red-400" />
              </div>
              <span className="text-xl font-extrabold text-red-400 leading-none">-{summary.totalOut}</span>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-zinc-800">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Estoque Baixo</span>
                <AlertOctagon className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-xl font-extrabold text-amber-400 leading-none">{summary.lowStockProducts}</span>
              <p className="text-[10px] text-zinc-500 mt-1.5">com 5 ou menos</p>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-zinc-800">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Sem Estoque</span>
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
              <span className="text-xl font-extrabold text-red-400 leading-none">{summary.outOfStockProducts}</span>
              <p className="text-[10px] text-zinc-500 mt-1.5">produtos zerados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {summary && summary.movementsByDay.length > 0 && (
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Movimentações por Dia</CardTitle>
            <CardDescription>Entradas e saídas nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.movementsByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="in" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="out" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {summary && summary.lowStockList.length > 0 && (
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-amber-400" /> Produtos com Estoque Baixo
            </CardTitle>
            <CardDescription>Produtos que precisam de reposição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.lowStockList.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{p.sku}</p>
                  </div>
                  <span className={`text-lg font-extrabold ${p.stock === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por produto, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
              {(['', 'IN', 'OUT', 'INVENTORY'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTypeFilter(opt)}
                  className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    typeFilter === opt ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt === '' ? 'Todas' : opt === 'IN' ? 'Entradas' : opt === 'OUT' ? 'Saídas' : 'Inventário'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left py-3 px-4 font-medium">Produto</th>
                  <th className="text-left py-3 px-4 font-medium">SKU</th>
                  <th className="text-center py-3 px-4 font-medium">Tipo</th>
                  <th className="text-right py-3 px-4 font-medium">Quantidade</th>
                  <th className="text-right py-3 px-4 font-medium">Estoque Atual</th>
                  <th className="text-left py-3 px-4 font-medium">Motivo</th>
                  <th className="text-right py-3 px-4 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-200 font-medium">{m.product.name}</td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{m.product.sku}</td>
                      <td className="py-3 px-4 text-center"><TypeBadge type={m.type} /></td>
                      <td className={`py-3 px-4 text-right font-bold ${m.type === 'IN' ? 'text-emerald-400' : m.type === 'OUT' ? 'text-red-400' : 'text-amber-400'}`}>
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-300">{m.product.stock}</td>
                      <td className="py-3 px-4 text-zinc-400 max-w-[200px] truncate">{m.reason || '-'}</td>
                      <td className="py-3 px-4 text-right text-zinc-500">{formatDate(m.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Nova Movimentação</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <span className="sr-only">Fechar</span>✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Produto *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Estoque: {p.stock}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tipo *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                  >
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saída</option>
                    <option value="INVENTORY">Inventário</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Motivo</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                  placeholder="Ex: Nova compra, Venda ML-123, Avaria..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

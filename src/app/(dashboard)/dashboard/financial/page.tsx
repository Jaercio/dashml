'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  DollarSign, Plus, Search, Loader2, AlertTriangle, RotateCcw,
  Edit2, Trash2, X, Filter, ArrowUpDown, Receipt, TrendingDown,
  Calendar, Wallet, Tag
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface FinancialRecord {
  id: string;
  description: string;
  type: string;
  amount: number;
  date: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

const EXPENSE_TYPES = [
  { value: 'FIXED_COST', label: 'Custo Fixo', color: '#ef4444' },
  { value: 'VARIABLE_COST', label: 'Custo Variável', color: '#f97316' },
  { value: 'SALARY', label: 'Salário', color: '#8b5cf6' },
  { value: 'RENT', label: 'Aluguel', color: '#6366f1' },
  { value: 'ENERGY', label: 'Energia', color: '#eab308' },
  { value: 'INTERNET', label: 'Internet', color: '#06b6d4' },
  { value: 'TAX', label: 'Imposto', color: '#dc2626' },
  { value: 'PACKAGING', label: 'Embalagem', color: '#22c55e' },
  { value: 'LABEL', label: 'Etiqueta', color: '#14b8a6' },
  { value: 'EXTRA_SHIPPING', label: 'Frete Extra', color: '#f43f5e' },
  { value: 'OTHER', label: 'Outros', color: '#71717a' },
];

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#4f46e5', '#4338ca', '#3730a3', '#ef4444', '#f97316'];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

function getTypeInfo(type: string) {
  return EXPENSE_TYPES.find((t) => t.value === type) || { label: type, color: '#71717a' };
}

const initialFormData = {
  description: '',
  type: 'OTHER',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  category: '',
};

export default function FinancialPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [byType, setByType] = useState<{ type: string; total: number }[]>([]);
  const [byMonth, setByMonth] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00');
        params.set('startDate', start.toISOString());
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59');
        params.set('endDate', end.toISOString());
      }

      const res = await fetch(`/api/financial?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setRecords(data.data);
      setByType(data.byType || []);
      setByMonth(data.byMonth || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar registros financeiros.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, dateStart, dateEnd]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  const monthlyData = byMonth.map((m) => ({
    ...m,
    month: new Date(m.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
  }));

  const pieData = byType.map((t) => ({
    ...t,
    category: getTypeInfo(t.type).label,
  }));

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormData({ ...initialFormData });
    setShowModal(true);
  };

  const openEditModal = (record: FinancialRecord) => {
    setEditingRecord(record);
    setFormData({
      description: record.description,
      type: record.type,
      amount: record.amount,
      date: new Date(record.date).toISOString().split('T')[0],
      category: record.category || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount || !formData.date) {
      alert('Descrição, valor e data são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const url = editingRecord ? `/api/financial/${editingRecord.id}` : '/api/financial';
      const method = editingRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: Number(formData.amount) }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setShowModal(false);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/financial/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDeleteConfirm(null);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover registro.');
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando dados financeiros...</p>
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
          <button onClick={fetchRecords} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Módulo Financeiro</h2>
          <p className="text-sm text-zinc-400 mt-1">Controle de despesas operacionais</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nova Despesa
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Total Despesas</span>
              <DollarSign className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-xl font-extrabold text-white leading-none">{formatBRL(totalAmount)}</span>
            <p className="text-[10px] text-zinc-500 mt-1.5">{records.length} registro{records.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        {byType.slice(0, 3).map((item) => {
          const info = getTypeInfo(item.type);
          return (
            <Card key={item.type} className="glassmorphism border-zinc-800">
              <CardContent className="pt-5 pb-4 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{info.label}</span>
                  <Receipt className="h-4 w-4" style={{ color: info.color }} />
                </div>
                <span className="text-xl font-extrabold text-white leading-none">{formatBRL(item.total)}</span>
                <p className="text-[10px] text-zinc-500 mt-1.5">{((item.total / totalAmount) * 100).toFixed(1)}% do total</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Despesas por Tipo</CardTitle>
            <CardDescription>Distribuição por categoria de despesa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="total" nameKey="category" cx="50%" cy="45%" outerRadius={85} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                    {pieData.map((_, idx) => (
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

        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Evolução Mensal</CardTitle>
            <CardDescription>Despesas totais por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatBRL(Number(value))} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="total" name="Despesas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
            >
              <option value="">Todos os tipos</option>
              {EXPENSE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
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

      {/* Records Table */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left py-3 px-4 font-medium">Descrição</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-right py-3 px-4 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 font-medium">Data</th>
                  <th className="text-left py-3 px-4 font-medium">Categoria</th>
                  <th className="text-center py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      <Wallet className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      Nenhum registro financeiro encontrado.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const info = getTypeInfo(record.type);
                    return (
                      <tr key={record.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4 text-zinc-200 font-medium">{record.description}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border" style={{
                            backgroundColor: `${info.color}15`,
                            borderColor: `${info.color}40`,
                            color: info.color,
                          }}>
                            {info.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-red-400 font-semibold">{formatBRL(record.amount)}</td>
                        <td className="py-3 px-4 text-zinc-400">{formatDate(record.date)}</td>
                        <td className="py-3 px-4 text-zinc-500">{record.category || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(record)}
                              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(record.id)}
                              className="p-1.5 rounded-md hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">
                {editingRecord ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                  placeholder="Ex: Aluguel do galpão"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tipo *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoria</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="Ex: Operacional"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingRecord ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Registro</h3>
                <p className="text-xs text-zinc-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 mb-5">
              Tem certeza que deseja excluir este registro financeiro?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

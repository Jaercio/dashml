'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  AlertOctagon, Search, Loader2, AlertTriangle, RotateCcw,
  Clock, CheckCircle, XCircle
} from 'lucide-react';

interface Complaint {
  id: string;
  mlComplaintId: string | null;
  type: string;
  status: string;
  deadline: string | null;
  reason: string | null;
  lostValue: number;
  createdAt: string;
  sale: { mlOrderId: string };
  product: { name: string; sku: string };
  customer: { name: string };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-amber-950/60 border-amber-800/50 text-amber-400',
    RESOLVED: 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400',
    CLOSED: 'bg-zinc-800 border-zinc-700 text-zinc-400',
  };
  const labels: Record<string, string> = { OPEN: 'Aberta', RESOLVED: 'Resolvida', CLOSED: 'Fechada' };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {labels[status] || status}
    </span>
  );
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/complaints?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setComplaints(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar reclamações.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const totalLost = complaints.reduce((sum, c) => sum + c.lostValue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando reclamações...</p>
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
          <button onClick={fetchComplaints} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Controle de Reclamações</h2>
        <p className="text-sm text-zinc-400 mt-1">Acompanhamento de ocorrências do Mercado Livre</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Total</span>
              <AlertOctagon className="h-4 w-4 text-zinc-400" />
            </div>
            <span className="text-xl font-extrabold text-white leading-none">{complaints.length}</span>
            <p className="text-[10px] text-zinc-500 mt-1.5">reclamações</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Em Aberto</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-xl font-extrabold text-amber-400 leading-none">{openCount}</span>
            <p className="text-[10px] text-zinc-500 mt-1.5">requer atenção</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Prejuízo Total</span>
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-xl font-extrabold text-red-400 leading-none">{formatBRL(totalLost)}</span>
            <p className="text-[10px] text-zinc-500 mt-1.5">em valores perdidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex rounded-lg border border-zinc-800 overflow-hidden w-fit">
            {(['', 'OPEN', 'RESOLVED', 'CLOSED'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === opt ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {opt === '' ? 'Todas' : opt === 'OPEN' ? 'Abertas' : opt === 'RESOLVED' ? 'Resolvidas' : 'Fechadas'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium">Produto</th>
                  <th className="text-left py-3 px-4 font-medium">Pedido</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Prejuízo</th>
                  <th className="text-right py-3 px-4 font-medium">Prazo</th>
                  <th className="text-right py-3 px-4 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <AlertOctagon className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      Nenhuma reclamação encontrada.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-200 font-medium">{c.type}</td>
                      <td className="py-3 px-4 text-zinc-400">{c.customer.name}</td>
                      <td className="py-3 px-4 text-zinc-400 max-w-[120px] truncate">{c.product.name}</td>
                      <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{c.sale.mlOrderId}</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={c.status} /></td>
                      <td className={`py-3 px-4 text-right font-semibold ${c.lostValue > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                        {formatBRL(c.lostValue)}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400">
                        {c.deadline ? formatDate(c.deadline) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

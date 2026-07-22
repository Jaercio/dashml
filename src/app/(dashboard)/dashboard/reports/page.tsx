'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  FileText, Download, Calendar, Package, DollarSign, ShoppingCart,
  AlertOctagon, Users, BarChart3, Filter
} from 'lucide-react';

type ReportType = 'sales' | 'financial' | 'products' | 'customers' | 'complaints';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const REPORTS: ReportConfig[] = [
  { id: 'sales', title: 'Relatório de Vendas', description: 'Vendas, lucros, margens e ROI por período', icon: ShoppingCart, color: 'text-indigo-400' },
  { id: 'financial', title: 'Relatório Financeiro', description: 'Despesas por tipo e categoria', icon: DollarSign, color: 'text-emerald-400' },
  { id: 'products', title: 'Relatório de Produtos', description: 'Catálogo, preços e estoque', icon: Package, color: 'text-cyan-400' },
  { id: 'customers', title: 'Relatório de Clientes', description: 'Base de clientes e compras', icon: Users, color: 'text-purple-400' },
  { id: 'complaints', title: 'Relatório de Reclamações', description: 'Ocorrências e prejuízos', icon: AlertOctagon, color: 'text-red-400' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (format: 'csv' | 'json') => {
    if (!selectedReport) return;
    setGenerating(true);

    try {
      const params = new URLSearchParams();
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00');
        params.set('startDate', start.toISOString());
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59');
        params.set('endDate', end.toISOString());
      }

      let endpoint = '';
      switch (selectedReport) {
        case 'sales': endpoint = '/api/sales'; break;
        case 'financial': endpoint = '/api/financial'; break;
        case 'products': endpoint = '/api/products'; break;
        case 'customers': endpoint = '/api/customers'; break;
        case 'complaints': endpoint = '/api/complaints'; break;
      }

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      const rows = data.data;
      if (!rows || rows.length === 0) {
        alert('Nenhum dado encontrado para o período selecionado.');
        return;
      }

      if (format === 'csv') {
        const headers = Object.keys(rows[0]).filter((k) => !k.startsWith('_'));
        const csvContent = [
          headers.join(','),
          ...rows.map((row: any) => headers.map((h) => {
            const val = row[h];
            return typeof val === 'object' ? JSON.stringify(val) : val;
          }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `dashml-${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `dashml-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar relatório.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Emissão de Relatórios</h2>
        <p className="text-sm text-zinc-400 mt-1">Gere e exporte relatórios do ERP</p>
      </div>

      {/* Report Types Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className={`glassmorphism border-zinc-800 cursor-pointer transition-all hover:border-indigo-600 ${
                selectedReport === report.id ? 'border-indigo-600 ring-1 ring-indigo-600/30' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="pt-5 pb-4 px-4 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-3 ${report.color}`} />
                <h3 className="text-sm font-bold text-white mb-1">{report.title}</h3>
                <p className="text-[10px] text-zinc-500">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Options */}
      {selectedReport && (
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-400" />
              Opções de Exportação
            </CardTitle>
            <CardDescription>
              Configure o período e formato para o relatório de{' '}
              <strong className="text-white">{REPORTS.find((r) => r.id === selectedReport)?.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data Início</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data Fim</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleGenerate('csv')}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                {generating ? 'Gerando...' : 'Exportar CSV'}
              </button>
              <button
                onClick={() => handleGenerate('json')}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                {generating ? 'Gerando...' : 'Exportar JSON'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

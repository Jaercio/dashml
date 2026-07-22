'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Settings, Save, Loader2, Shield, Database, Clock, Globe, Palette
} from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Configurações do ERP</h2>
          <p className="text-sm text-zinc-400 mt-1">Preferências e configurações do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" /> Geral
            </CardTitle>
            <CardDescription>Configurações básicas do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do ERP</label>
              <input type="text" defaultValue="dashML" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Moeda Padrão</label>
              <select defaultValue="BRL" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer">
                <option value="BRL">BRL - Real Brasileiro (R$)</option>
                <option value="USD">USD - Dólar Americano ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fuso Horário</label>
              <select defaultValue="America/Sao_Paulo" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer">
                <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                <option value="America/Manaus">América/Manaus (GMT-4)</option>
                <option value="America/Noronha">América/Noronha (GMT-2)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-400" /> Aparência
            </CardTitle>
            <CardDescription>Personalização visual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tema</label>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-zinc-950 border-2 border-indigo-600 rounded-lg text-sm text-white font-medium cursor-pointer">
                  Escuro
                </button>
                <button className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 font-medium cursor-pointer hover:border-zinc-700 transition-colors" disabled>
                  Claro (em breve)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cor de Destaque</label>
              <div className="flex gap-2">
                {['#6366f1', '#8b5cf6', '#22c55e', '#f97316', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    className="h-8 w-8 rounded-full border-2 border-transparent hover:border-white/30 transition-colors cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" /> Segurança
            </CardTitle>
            <CardDescription>Configurações de segurança e autenticação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">JWT Expiração</p>
                <p className="text-[10px] text-zinc-500">Tempo de vida do token de sessão</p>
              </div>
              <select defaultValue="24" className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none cursor-pointer">
                <option value="1">1 hora</option>
                <option value="8">8 horas</option>
                <option value="24">24 horas</option>
                <option value="72">3 dias</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">Force HTTPS</p>
                <p className="text-[10px] text-zinc-500">Redirecionar HTTP para HTTPS</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-indigo-600 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="glassmorphism border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" /> Dados
            </CardTitle>
            <CardDescription>Backup e dados do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">Banco de Dados</p>
                <p className="text-[10px] text-zinc-500">SQLite (desenvolvimento)</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">Versão</p>
                <p className="text-[10px] text-zinc-500">dashML ERP v0.1.0</p>
              </div>
              <span className="text-xs text-zinc-500">Alpha</span>
            </div>
            <button className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2">
              <Database className="h-4 w-4" /> Exportar Backup Completo
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

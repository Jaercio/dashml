'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Link2,
  Package,
  Boxes,
  DollarSign,
  TrendingUp,
  Users,
  AlertOctagon,
  FileBarChart2,
  Bell,
  Settings,
  ShieldCheck,
  Power
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  userRole?: string;
}

export function Sidebar({ onLogout, userRole }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Integração ML', href: '/dashboard/integration', icon: Link2 },
    { name: 'Produtos', href: '/dashboard/products', icon: Package },
    { name: 'Controle de Estoque', href: '/dashboard/stock', icon: Boxes },
    { name: 'Financeiro', href: '/dashboard/financial', icon: DollarSign },
    { name: 'Vendas & Lucros', href: '/dashboard/sales', icon: TrendingUp },
    { name: 'Clientes', href: '/dashboard/customers', icon: Users },
    { name: 'Reclamações', href: '/dashboard/complaints', icon: AlertOctagon },
    { name: 'Relatórios', href: '/dashboard/reports', icon: FileBarChart2 },
    { name: 'Notificações', href: '/dashboard/notifications', icon: Bell },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/60">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-black font-extrabold text-sm">
            ml
          </div>
          <span className="font-extrabold tracking-tight text-white text-lg">dashML <span className="text-[10px] text-zinc-500 font-normal">ERP</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group',
                isActive
                  ? 'bg-zinc-800/80 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Session */}
      <div className="p-4 border-t border-border/60 bg-zinc-950/40">
        {userRole ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 mb-3 rounded bg-zinc-900/50 border border-border/40">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Permissão: {userRole}
            </span>
          </div>
        ) : null}
        
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <Power className="h-4 w-4 shrink-0" />
          <span>Sair do ERP</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Bell, Loader2, AlertTriangle, RotateCcw, CheckCircle, ShoppingCart,
  DollarSign, AlertOctagon, Package, Truck, Pause, XCircle
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  SALE: { icon: ShoppingCart, color: 'text-emerald-400' },
  PAYMENT: { icon: DollarSign, color: 'text-indigo-400' },
  COMPLAINT: { icon: AlertOctagon, color: 'text-red-400' },
  RETURN: { icon: Truck, color: 'text-amber-400' },
  LOW_STOCK: { icon: Package, color: 'text-orange-400' },
  PAUSED_PRODUCT: { icon: Pause, color: 'text-yellow-400' },
  NO_STOCK: { icon: XCircle, color: 'text-red-500' },
  SYSTEM: { icon: Bell, color: 'text-zinc-400' },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setNotifications(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando notificações...</p>
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
          <button onClick={fetchNotifications} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
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
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Painel de Notificações</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => setNotifications(notifications.map((n) => ({ ...n, isRead: true })))}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle className="h-4 w-4" /> Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="glassmorphism border-zinc-800">
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhuma notificação no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;
            return (
              <Card key={n.id} className={`glassmorphism border-zinc-800 transition-colors ${!n.isRead ? 'border-l-2 border-l-indigo-500' : ''}`}>
                <CardContent className="py-4 px-5 flex items-start gap-4">
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{n.description}</p>
                    <p className="text-[10px] text-zinc-600 mt-1.5">{formatDate(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

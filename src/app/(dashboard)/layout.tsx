'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { Loader2, User as UserIcon, Bell } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Sessão expirada');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout;

    const autoSync = async () => {
      try {
        const statusRes = await fetch(`/api/integration/status?userId=${user.id}`);
        const statusData = await statusRes.json();
        if (!statusData.success || !statusData.data?.connected) return;

        await fetch(`/api/integration/sync?userId=${user.id}`, { method: 'POST' });
      } catch {
        // silently fail
      }
    };

    autoSync();
    intervalId = setInterval(autoSync, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-sm text-zinc-400">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar onLogout={handleLogout} userRole={user?.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-border/60 bg-card/50 backdrop-blur flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Área Administrativa
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            {/* Notification trigger */}
            <button className="relative text-zinc-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-zinc-900">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </button>

            {/* Profile widget */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-border/80 pl-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-white leading-none">{user.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{user.email}</p>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-8 bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

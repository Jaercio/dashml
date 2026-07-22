'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Package,
  Users,
  Clock,
  ExternalLink,
  Info,
  Settings,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface IntegrationStatus {
  connected: boolean;
  sellerId?: string;
  sellerName?: string;
  syncedAt?: string | null;
  expiresAt?: string;
  isExpired?: boolean;
}

interface SyncResult {
  success: boolean;
  syncedAt: string;
  summary: {
    products: number;
    sales: number;
    customers: number;
  };
  error?: string;
}

interface CredentialsStatus {
  configured: boolean;
  clientId: string | null;
  hasClientSecret: boolean;
}

export default function IntegrationPage() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [credentials, setCredentials] = useState<CredentialsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showSetup, setShowSetup] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  const fetchStatus = useCallback(async (uid: string) => {
    try {
      const response = await fetch(`/api/integration/status?userId=${uid}`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar status:', err);
    }
  }, []);

  const fetchCredentials = useCallback(async () => {
    try {
      const response = await fetch('/api/integration/credentials');
      const data = await response.json();
      if (data.success) {
        setCredentials(data.data);
        if (!data.data.configured) {
          setShowSetup(true);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar credenciais:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meText = await meRes.text();
        console.log('[ML] /api/auth/me status:', meRes.status, 'body:', meText.substring(0, 200));

        let meData;
        try {
          meData = JSON.parse(meText);
        } catch {
          console.error('[ML] /api/auth/me retornou HTML:', meText.substring(0, 500));
          setError('Erro ao carregar dados do usuário. Verifique o console.');
          setLoading(false);
          return;
        }

        if (meData.success && meData.user?.id) {
          setUserId(meData.user.id);

          const statusRes = await fetch(`/api/integration/status?userId=${meData.user.id}`);
          const statusText = await statusRes.text();
          console.log('[ML] /api/integration/status status:', statusRes.status, 'body:', statusText.substring(0, 200));

          try {
            const statusData = JSON.parse(statusText);
            if (statusData.success) setStatus(statusData.data);
          } catch {
            console.error('[ML] /api/integration/status retornou HTML:', statusText.substring(0, 500));
          }

          const credRes = await fetch('/api/integration/credentials');
          const credText = await credRes.text();
          console.log('[ML] /api/integration/credentials status:', credRes.status, 'body:', credText.substring(0, 200));

          try {
            const credData = JSON.parse(credText);
            if (credData.success) {
              setCredentials(credData.data);
              if (!credData.data.configured) setShowSetup(true);
            }
          } catch {
            console.error('[ML] /api/integration/credentials retornou HTML:', credText.substring(0, 500));
          }
        } else {
          console.error('[ML] /api/auth/me falhou:', meData);
        }
      } catch (err) {
        console.error('[ML] Erro geral no init:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const urlError = searchParams.get('error');
    const urlSuccess = searchParams.get('success');

    if (urlError) {
      setError(decodeURIComponent(urlError));
      window.history.replaceState({}, '', '/dashboard/integration');
    }
    if (urlSuccess === 'true') {
      setSuccess('Conta conectada com sucesso!');
      window.history.replaceState({}, '', '/dashboard/integration');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status?.connected && userId) {
      const interval = setInterval(() => fetchStatus(userId), 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [status?.connected, userId, fetchStatus]);

  const handleSaveCredentials = async () => {
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setError('Preencha o Client ID e o Client Secret.');
      return;
    }

    setSavingCredentials(true);
    setError(null);

    try {
      const response = await fetch('/api/integration/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdInput.trim(),
          clientSecret: clientSecretInput.trim(),
        }),
      });

      const text = await response.text();
      console.log('[ML] POST /api/integration/credentials status:', response.status, 'body:', text.substring(0, 500));

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('[ML] Resposta não-JSON:', text.substring(0, 500));
        throw new Error('Servidor retornou erro. Verifique o console.');
      }

      if (data.success) {
        setSuccess('Credenciais salvas com sucesso!');
        setShowSetup(false);
        setCredentials({
          configured: true,
          clientId: clientIdInput.trim(),
          hasClientSecret: true,
        });
        setClientIdInput('');
        setClientSecretInput('');
      } else {
        setError(data.message || 'Erro ao salvar credenciais');
      }
    } catch (err: any) {
      console.error('[ML] Erro no handleSaveCredentials:', err);
      setError(err.message || 'Erro ao salvar credenciais');
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      if (!userId) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(`/api/integration/connect?userId=${userId}`);
      const text = await response.text();
      console.log('[ML] /api/integration/connect status:', response.status, 'body:', text.substring(0, 300));

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('[ML] /api/integration/connect retornou HTML:', text.substring(0, 500));
        throw new Error('Servidor retornou erro HTML. Veja o console do navegador.');
      }

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'Erro ao gerar link de conexão');
        setConnecting(false);
      }
    } catch (err: any) {
      console.error('[ML] Erro no handleConnect:', err);
      setError(err.message || 'Erro ao conectar com o servidor');
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      if (!userId) {
        throw new Error('Sessão expirada.');
      }

      const response = await fetch(`/api/integration/sync?userId=${userId}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setSyncResult(data.data);
        setSuccess('Sincronização concluída com sucesso!');
        fetchStatus(userId);
      } else {
        setError(data.message || 'Erro ao sincronizar');
      }
    } catch (err) {
      setError('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar sua conta do Mercado Livre?')) {
      return;
    }

    setDisconnecting(true);
    setError(null);

    try {
      if (!userId) {
        throw new Error('Sessão expirada.');
      }

      const response = await fetch(`/api/integration/disconnect?userId=${userId}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setStatus(null);
        setSuccess('Conta desconectada com sucesso!');
        fetchStatus(userId);
      } else {
        setError(data.message || 'Erro ao desconectar');
      }
    } catch (err) {
      setError('Erro ao desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearAndSync = async () => {
    if (!confirm('Isso vai apagar TODOS os dados locais (produtos, vendas, clientes) e importar apenas do ML. Continuar?')) {
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      if (!userId) throw new Error('Sessão expirada.');

      const clearRes = await fetch(`/api/integration/clear-data?userId=${userId}`, { method: 'POST' });
      const clearData = await clearRes.json();
      if (!clearData.success) {
        throw new Error(clearData.message || 'Erro ao limpar dados');
      }

      const syncRes = await fetch(`/api/integration/sync?userId=${userId}`, { method: 'POST' });
      const syncData = await syncRes.json();

      if (syncData.success) {
        setSyncResult(syncData.data);
        setSuccess('Dados limpos e sincronizados com sucesso!');
        fetchStatus(userId);
      } else {
        setError(syncData.message || 'Erro ao sincronizar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao limpar e sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
          <Link2 className="h-5 w-5 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Integração Mercado Livre</h1>
          <p className="text-sm text-zinc-400">
            Conecte sua conta para sincronizar vendas, produtos e clientes automaticamente
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-950/30 border border-red-800/50">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/50">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">{success}</p>
        </div>
      )}

      {showSetup && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/20">
              <Settings className="h-5 w-5 text-[#FFE600]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Configuração Inicial</h2>
              <p className="text-sm text-zinc-400">
                Configure as credenciais do Mercado Livre para começar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <h3 className="text-sm font-medium text-white mb-2">Como obter suas credenciais:</h3>
              <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
                <li>Acesse o <a href="https://developers.mercadolibre.com.ar/" target="_blank" rel="noopener noreferrer" className="text-[#3483FA] hover:underline">Portal de Desenvolvedores do ML</a></li>
                <li>Crie uma conta ou faça login</li>
                <li>Crie uma aplicação (App)</li>
                <li>Copie o <strong className="text-zinc-300">Client ID</strong> e o <strong className="text-zinc-300">Client Secret</strong></li>
                <li>Cole abaixo</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Client ID</label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Ex: 1234567890123456"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3483FA]/50 focus:border-[#3483FA] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Client Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder="Ex: TG-1234567890123456-0987654321-abcdef"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3483FA]/50 focus:border-[#3483FA] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 cursor-pointer"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleSaveCredentials}
                disabled={savingCredentials || !clientIdInput.trim() || !clientSecretInput.trim()}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-[#3483FA] text-white text-sm font-semibold hover:bg-[#2968C8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingCredentials ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>{savingCredentials ? 'Salvando...' : 'Salvar e Continuar'}</span>
              </button>
              {credentials?.configured && (
                <button
                  onClick={() => setShowSetup(false)}
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!showSetup && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    status?.connected
                      ? 'bg-emerald-950/50 border border-emerald-800/50'
                      : 'bg-zinc-800 border border-zinc-700'
                  }`}
                >
                  {status?.connected ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {status?.connected ? 'Conectado' : 'Desconectado'}
                  </h2>
                  {status?.connected && status.sellerName && (
                    <p className="text-sm text-zinc-400">
                      Vendedor: {status.sellerName} (ID: {status.sellerId})
                    </p>
                  )}
                  {status?.connected && status.syncedAt && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Última sincronização: {formatDate(status.syncedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {status?.connected ? (
                  <>
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {syncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span>{syncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                    </button>
                    <button
                      onClick={handleClearAndSync}
                      disabled={syncing}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-950/30 border border-amber-800/50 text-sm font-medium text-amber-400 hover:bg-amber-950/50 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {syncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span>{syncing ? 'Limpando...' : 'Limpar e Sincronizar do ML'}</span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-950/30 border border-red-800/50 text-sm font-medium text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {disconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="h-4 w-4" />
                      )}
                      <span>{disconnecting ? 'Desconectando...' : 'Desconectar'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-[#3483FA] text-white text-sm font-semibold hover:bg-[#2968C8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    <span>{connecting ? 'Redirecionando...' : 'Conectar ao Mercado Livre'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {syncResult && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resultado da Sincronização</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <Package className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{syncResult.summary.products}</p>
                    <p className="text-xs text-zinc-400">Produtos Sincronizados</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <ShoppingCart className="h-8 w-8 text-emerald-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{syncResult.summary.sales}</p>
                    <p className="text-xs text-zinc-400">Vendas Importadas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <Users className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{syncResult.summary.customers}</p>
                    <p className="text-xs text-zinc-400">Clientes Atualizados</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Sincronizado em: {formatDate(syncResult.syncedAt)}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Como funciona</h3>
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Reconfigurar credenciais</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Configure suas credenciais</p>
                  <p className="text-xs text-zinc-400">
                    Cole o Client ID e Secret do portal de desenvolvedores do ML (uma única vez).
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Conecte sua conta</p>
                  <p className="text-xs text-zinc-400">
                    Você será redirecionado para o site do Mercado Livre para autorizar o acesso.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Sincronização automática</p>
                  <p className="text-xs text-zinc-400">
                    Os dados são sincronizados automaticamente a cada 15 minutos, ou clique em &quot;Sincronizar Agora&quot;.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Informações importantes</h3>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  <li>• O acesso é apenas leitura. Não realizamos nenhuma ação na sua conta ML.</li>
                  <li>• Seus dados de acesso são criptografados e armazenados com segurança.</li>
                  <li>• Você pode desconectar a qualquer momento.</li>
                  <li>• A sincronização automática roda a cada 15 minutos quando a aba está aberta.</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('Por favor, digite seu e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao solicitar recuperação.');
      }

      setSuccessMessage(data.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 shadow-inner">
            <span className="text-xl font-bold tracking-tighter text-white">ml</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            Recuperação de Senha
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Redefina sua senha de acesso ao ERP dashML
          </p>
        </div>

        <Card className="glassmorphism border-zinc-800 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Esqueceu a senha?</CardTitle>
            <CardDescription>
              Insira o e-mail cadastrado e enviaremos as instruções de recuperação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="flex items-center space-x-2 rounded-md bg-red-950/40 border border-red-900/50 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {successMessage ? (
                <div className="flex items-center space-x-2 rounded-md bg-green-950/40 border border-green-900/50 p-3 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 mt-6">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    label="E-mail"
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || !!successMessage}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" isLoading={isLoading} disabled={!!successMessage}>
                <KeyRound className="mr-2 h-4 w-4" /> Recuperar Senha
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mx-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

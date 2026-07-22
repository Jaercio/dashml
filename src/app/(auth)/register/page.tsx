'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserPlus, Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'ADMIN' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect after 2.5 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2500);
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
            Criar conta no dashML
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a gerenciar suas vendas do Mercado Livre como um profissional
          </p>
        </div>

        <Card className="glassmorphism border-zinc-800 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Cadastro</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar seu acesso de administrador.
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

              {success ? (
                <div className="flex items-center space-x-2 rounded-md bg-green-950/40 border border-green-900/50 p-3 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>Conta criada com sucesso! Redirecionando para login...</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 mt-6">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    label="Nome Completo"
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || success}
                  />
                </div>

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
                    disabled={isLoading || success}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 mt-6">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    label="Senha"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || success}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 mt-6">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    label="Confirmar Senha"
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" isLoading={isLoading} disabled={success}>
                <UserPlus className="mr-2 h-4 w-4" /> Criar Conta
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground w-full">
              Já possui uma conta?{' '}
              <Link href="/login" className="font-medium text-white hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

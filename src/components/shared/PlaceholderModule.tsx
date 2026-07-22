'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowRight, Hammer, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface PlaceholderModuleProps {
  title: string;
  stageNumber: number;
  description: string;
}

export function PlaceholderModule({ title, stageNumber, description }: PlaceholderModuleProps) {
  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">{title}</h2>
        <p className="text-sm text-zinc-400 mt-1">Status do Módulo ERP</p>
      </div>

      <Card className="glassmorphism border-zinc-800">
        <CardHeader className="space-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 mb-2">
            <Hammer className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold">Módulo em Desenvolvimento</CardTitle>
          <CardDescription>
            Este recurso faz parte do cronograma de desenvolvimento do ERP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            O módulo <strong className="text-white">{title}</strong> será construído na{' '}
            <span className="text-white font-bold underline decoration-zinc-600">Etapa {stageNumber}</span> da nossa stack SaaS.
          </p>
          <p className="text-sm text-zinc-400">
            {description}
          </p>
          
          <div className="flex pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer group"
            >
              <span>Voltar para o Início</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

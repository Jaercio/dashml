import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar fornecedores.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cnpj, email, phone } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Nome do fornecedor é obrigatório.' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        cnpj: cnpj || null,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Fornecedor criado com sucesso!', data: supplier },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao criar fornecedor.' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { StockRepository } from '@/infrastructure/database/StockRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const summary = searchParams.get('summary') === 'true';

    const repository = new StockRepository();

    if (summary) {
      const data = await repository.getSummary({ search, type, startDate, endDate });
      return NextResponse.json({ success: true, data });
    }

    const movements = await repository.findAll({ search, type, startDate, endDate });
    return NextResponse.json({ success: true, data: movements, total: movements.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar movimentações.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, type, quantity, reason } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { success: false, message: 'Produto, tipo e quantidade são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!['IN', 'OUT', 'INVENTORY'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Tipo deve ser IN, OUT ou INVENTORY.' },
        { status: 400 }
      );
    }

    const repository = new StockRepository();
    const movement = await repository.create({ productId, type, quantity: Number(quantity), reason });

    return NextResponse.json(
      { success: true, message: 'Movimentação registrada com sucesso!', data: movement },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao criar movimentação.' },
      { status: 400 }
    );
  }
}

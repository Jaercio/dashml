import { NextResponse } from 'next/server';
import { GetFinancialRecords } from '@/core/use-cases/GetFinancialRecords';
import { CreateFinancialRecord } from '@/core/use-cases/CreateFinancialRecord';
import { PrismaFinancialRecordRepository } from '@/infrastructure/database/PrismaFinancialRecordRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const repository = new PrismaFinancialRecordRepository();
    const getRecords = new GetFinancialRecords(repository);

    const result = await getRecords.execute({
      filters: { search, type, startDate, endDate },
    });

    return NextResponse.json({
      success: true,
      data: result.records,
      total: result.total,
      byType: result.byType,
      byMonth: result.byMonth,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar registros financeiros.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repository = new PrismaFinancialRecordRepository();
    const createRecord = new CreateFinancialRecord(repository);

    const record = await createRecord.execute(body);

    return NextResponse.json(
      { success: true, message: 'Registro criado com sucesso!', data: record },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao criar registro financeiro.' },
      { status: 400 }
    );
  }
}

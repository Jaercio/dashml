import { NextResponse } from 'next/server';
import { UpdateFinancialRecord } from '@/core/use-cases/UpdateFinancialRecord';
import { DeleteFinancialRecord } from '@/core/use-cases/DeleteFinancialRecord';
import { PrismaFinancialRecordRepository } from '@/infrastructure/database/PrismaFinancialRecordRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repository = new PrismaFinancialRecordRepository();
    const record = await repository.findById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Registro não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar registro.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const repository = new PrismaFinancialRecordRepository();
    const updateRecord = new UpdateFinancialRecord(repository);

    const record = await updateRecord.execute(id, body);

    return NextResponse.json({
      success: true,
      message: 'Registro atualizado com sucesso!',
      data: record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao atualizar registro.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repository = new PrismaFinancialRecordRepository();
    const deleteRecord = new DeleteFinancialRecord(repository);

    await deleteRecord.execute(id);

    return NextResponse.json({
      success: true,
      message: 'Registro removido com sucesso!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao remover registro.' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { UpdateProduct } from '@/core/use-cases/UpdateProduct';
import { DeleteProduct } from '@/core/use-cases/DeleteProduct';
import { PrismaProductRepository } from '@/infrastructure/database/PrismaProductRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productRepository = new PrismaProductRepository();
    const product = await productRepository.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Produto não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar produto.' },
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
    const productRepository = new PrismaProductRepository();
    const updateProduct = new UpdateProduct(productRepository);

    const product = await updateProduct.execute({ id, data: body });

    return NextResponse.json({
      success: true,
      message: 'Produto atualizado com sucesso!',
      data: product,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao atualizar produto.' },
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
    const productRepository = new PrismaProductRepository();
    const deleteProduct = new DeleteProduct(productRepository);

    await deleteProduct.execute(id);

    return NextResponse.json({
      success: true,
      message: 'Produto removido com sucesso!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao remover produto.' },
      { status: 400 }
    );
  }
}

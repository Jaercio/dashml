import { NextResponse } from 'next/server';
import { GetProducts } from '@/core/use-cases/GetProducts';
import { CreateProduct } from '@/core/use-cases/CreateProduct';
import { PrismaProductRepository } from '@/infrastructure/database/PrismaProductRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;
    const inStockParam = searchParams.get('inStock');
    const inStock = inStockParam !== null ? inStockParam === 'true' : undefined;

    const productRepository = new PrismaProductRepository();
    const getProducts = new GetProducts(productRepository);

    const result = await getProducts.execute({
      filters: { search, category, supplierId, isActive, inStock },
    });

    return NextResponse.json({
      success: true,
      data: result.products,
      total: result.total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar produtos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productRepository = new PrismaProductRepository();
    const createProduct = new CreateProduct(productRepository);

    const product = await createProduct.execute(body);

    return NextResponse.json(
      { success: true, message: 'Produto criado com sucesso!', data: product },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao criar produto.' },
      { status: 400 }
    );
  }
}

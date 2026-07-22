import { IProductRepository } from '../repositories/IProductRepository';
import { Product } from '../entities/Product';

interface CreateProductRequest {
  name: string;
  sku: string;
  internalCode?: string;
  mlCode?: string;
  category?: string;
  supplierId?: string;
  brand?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  minPrice?: number;
  idealPrice?: number;
  weight?: number;
  dimensions?: string;
  stock?: number;
  physicalLocation?: string;
  imageUrl?: string;
  barcode?: string;
  isActive?: boolean;
}

export class CreateProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(request: CreateProductRequest): Promise<Product> {
    const { name, sku } = request;

    if (!name || !sku) {
      throw new Error('Nome e SKU são obrigatórios.');
    }

    const existingSku = await this.productRepository.findBySku(sku);
    if (existingSku) {
      throw new Error('Já existe um produto com este SKU.');
    }

    return this.productRepository.create({
      ...request,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
    });
  }
}

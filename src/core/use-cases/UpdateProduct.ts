import { IProductRepository, UpdateProductData } from '../repositories/IProductRepository';
import { Product } from '../entities/Product';

interface UpdateProductRequest {
  id: string;
  data: UpdateProductData;
}

export class UpdateProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(request: UpdateProductRequest): Promise<Product> {
    const { id, data } = request;

    if (!id) {
      throw new Error('ID do produto é obrigatório.');
    }

    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new Error('Produto não encontrado.');
    }

    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await this.productRepository.findBySku(data.sku);
      if (skuExists) {
        throw new Error('Já existe um produto com este SKU.');
      }
    }

    return this.productRepository.update(id, {
      ...data,
      name: data.name?.trim(),
      sku: data.sku?.trim().toUpperCase(),
    });
  }
}

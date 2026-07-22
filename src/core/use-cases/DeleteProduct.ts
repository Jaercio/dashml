import { IProductRepository } from '../repositories/IProductRepository';

export class DeleteProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID do produto é obrigatório.');
    }

    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new Error('Produto não encontrado.');
    }

    await this.productRepository.delete(id);
  }
}

import { IProductRepository, ProductFilters } from '../repositories/IProductRepository';

interface GetProductsRequest {
  filters?: ProductFilters;
}

interface GetProductsResponse {
  products: any[];
  total: number;
}

export class GetProducts {
  constructor(private productRepository: IProductRepository) {}

  async execute(request: GetProductsRequest): Promise<GetProductsResponse> {
    const [products, total] = await Promise.all([
      this.productRepository.findAll(request.filters),
      this.productRepository.count(request.filters),
    ]);

    return { products, total };
  }
}

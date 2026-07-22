import { Product } from '../entities/Product';

export interface CreateProductData {
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

export interface UpdateProductData {
  name?: string;
  sku?: string;
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

export interface ProductFilters {
  search?: string;
  category?: string;
  supplierId?: string;
  isActive?: boolean;
  inStock?: boolean;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filters?: ProductFilters): Promise<Product[]>;
  count(filters?: ProductFilters): Promise<number>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
}

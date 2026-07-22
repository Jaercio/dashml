import { IProductRepository, CreateProductData, UpdateProductData, ProductFilters } from '../../core/repositories/IProductRepository';
import { Product } from '../../core/entities/Product';
import { prisma } from '../../lib/prisma';

export class PrismaProductRepository implements IProductRepository {
  private mapToDomain(dbProduct: any): Product {
    return new Product(
      dbProduct.id,
      dbProduct.name,
      dbProduct.sku,
      dbProduct.internalCode,
      dbProduct.mlCode,
      dbProduct.category,
      dbProduct.supplierId,
      dbProduct.brand,
      dbProduct.purchasePrice,
      dbProduct.sellingPrice,
      dbProduct.minPrice,
      dbProduct.idealPrice,
      dbProduct.weight,
      dbProduct.dimensions,
      dbProduct.stock,
      dbProduct.physicalLocation,
      dbProduct.imageUrl,
      dbProduct.barcode,
      dbProduct.isActive,
      dbProduct.createdAt,
      dbProduct.updatedAt
    );
  }

  async findById(id: string): Promise<Product | null> {
    const dbProduct = await prisma.product.findUnique({ where: { id } });
    if (!dbProduct) return null;
    return this.mapToDomain(dbProduct);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const dbProduct = await prisma.product.findUnique({ where: { sku } });
    if (!dbProduct) return null;
    return this.mapToDomain(dbProduct);
  }

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { mlCode: { contains: filters.search } },
        { brand: { contains: filters.search } },
        { category: { contains: filters.search } },
      ];
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.inStock) {
      where.stock = { gt: 0 };
    }

    const dbProducts = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return dbProducts.map((p: any) => this.mapToDomain(p));
  }

  async count(filters?: ProductFilters): Promise<number> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { mlCode: { contains: filters.search } },
        { brand: { contains: filters.search } },
        { category: { contains: filters.search } },
      ];
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.inStock) {
      where.stock = { gt: 0 };
    }

    return prisma.product.count({ where });
  }

  async create(data: CreateProductData): Promise<Product> {
    const dbProduct = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        internalCode: data.internalCode || null,
        mlCode: data.mlCode || null,
        category: data.category || null,
        supplierId: data.supplierId || null,
        brand: data.brand || null,
        purchasePrice: data.purchasePrice || 0,
        sellingPrice: data.sellingPrice || 0,
        minPrice: data.minPrice || 0,
        idealPrice: data.idealPrice || 0,
        weight: data.weight || 0,
        dimensions: data.dimensions || null,
        stock: data.stock || 0,
        physicalLocation: data.physicalLocation || null,
        imageUrl: data.imageUrl || null,
        barcode: data.barcode || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return this.mapToDomain(dbProduct);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const dbProduct = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        supplierId: data.supplierId || undefined,
      },
    });
    return this.mapToDomain(dbProduct);
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }
}

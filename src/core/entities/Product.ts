export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly sku: string,
    public readonly internalCode: string | null,
    public readonly mlCode: string | null,
    public readonly category: string | null,
    public readonly supplierId: string | null,
    public readonly brand: string | null,
    public readonly purchasePrice: number,
    public readonly sellingPrice: number,
    public readonly minPrice: number,
    public readonly idealPrice: number,
    public readonly weight: number,
    public readonly dimensions: string | null,
    public readonly stock: number,
    public readonly physicalLocation: string | null,
    public readonly imageUrl: string | null,
    public readonly barcode: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

export class StockMovement {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly type: string,
    public readonly quantity: number,
    public readonly reason: string | null,
    public readonly userId: string | null,
    public readonly createdAt: Date
  ) {}
}

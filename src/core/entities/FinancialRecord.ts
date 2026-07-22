export class FinancialRecord {
  constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly type: string,
    public readonly amount: number,
    public readonly date: Date,
    public readonly category: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

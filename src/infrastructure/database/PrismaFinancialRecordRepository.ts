import { IFinancialRecordRepository, CreateFinancialRecordData, UpdateFinancialRecordData, FinancialFilters } from '../../core/repositories/IFinancialRecordRepository';
import { FinancialRecord } from '../../core/entities/FinancialRecord';
import { prisma } from '../../lib/prisma';

export class PrismaFinancialRecordRepository implements IFinancialRecordRepository {
  private mapToDomain(dbRecord: any): FinancialRecord {
    return new FinancialRecord(
      dbRecord.id,
      dbRecord.description,
      dbRecord.type,
      dbRecord.amount,
      dbRecord.date,
      dbRecord.category,
      dbRecord.createdAt,
      dbRecord.updatedAt
    );
  }

  async findById(id: string): Promise<FinancialRecord | null> {
    const dbRecord = await prisma.financialRecord.findUnique({ where: { id } });
    if (!dbRecord) return null;
    return this.mapToDomain(dbRecord);
  }

  async findAll(filters?: FinancialFilters): Promise<FinancialRecord[]> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { category: { contains: filters.search } },
      ];
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate + 'T23:59:59');
    }

    const dbRecords = await prisma.financialRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return dbRecords.map((r: any) => this.mapToDomain(r));
  }

  async count(filters?: FinancialFilters): Promise<number> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { category: { contains: filters.search } },
      ];
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate + 'T23:59:59');
    }

    return prisma.financialRecord.count({ where });
  }

  async sumByType(filters?: FinancialFilters): Promise<{ type: string; total: number }[]> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate + 'T23:59:59');
    }

    const results = await prisma.financialRecord.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return results.map((r: any) => ({
      type: r.type,
      total: r._sum.amount || 0,
    }));
  }

  async sumByMonth(filters?: FinancialFilters): Promise<{ month: string; total: number }[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    const dbRecords = await prisma.financialRecord.findMany({
      where,
      select: { date: true, amount: true },
      orderBy: { date: 'asc' },
    });

    const monthlyMap = new Map<string, number>();
    for (const record of dbRecords) {
      const monthKey = record.date.toISOString().slice(0, 7);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + record.amount);
    }

    return Array.from(monthlyMap.entries()).map(([month, total]) => ({ month, total }));
  }

  async create(data: CreateFinancialRecordData): Promise<FinancialRecord> {
    const dbRecord = await prisma.financialRecord.create({
      data: {
        description: data.description.trim(),
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        category: data.category || null,
      },
    });
    return this.mapToDomain(dbRecord);
  }

  async update(id: string, data: UpdateFinancialRecordData): Promise<FinancialRecord> {
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    if (data.description) updateData.description = data.description.trim();

    const dbRecord = await prisma.financialRecord.update({
      where: { id },
      data: updateData,
    });
    return this.mapToDomain(dbRecord);
  }

  async delete(id: string): Promise<void> {
    await prisma.financialRecord.delete({ where: { id } });
  }
}

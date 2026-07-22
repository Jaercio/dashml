import { FinancialRecord } from '../entities/FinancialRecord';

export interface CreateFinancialRecordData {
  description: string;
  type: string;
  amount: number;
  date: string;
  category?: string;
}

export interface UpdateFinancialRecordData {
  description?: string;
  type?: string;
  amount?: number;
  date?: string;
  category?: string;
}

export interface FinancialFilters {
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface IFinancialRecordRepository {
  findById(id: string): Promise<FinancialRecord | null>;
  findAll(filters?: FinancialFilters): Promise<FinancialRecord[]>;
  count(filters?: FinancialFilters): Promise<number>;
  sumByType(filters?: FinancialFilters): Promise<{ type: string; total: number }[]>;
  sumByMonth(filters?: FinancialFilters): Promise<{ month: string; total: number }[]>;
  create(data: CreateFinancialRecordData): Promise<FinancialRecord>;
  update(id: string, data: UpdateFinancialRecordData): Promise<FinancialRecord>;
  delete(id: string): Promise<void>;
}

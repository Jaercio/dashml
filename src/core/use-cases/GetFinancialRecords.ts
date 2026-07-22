import { IFinancialRecordRepository, FinancialFilters } from '../repositories/IFinancialRecordRepository';
import { FinancialRecord } from '../entities/FinancialRecord';

interface GetFinancialRecordsRequest {
  filters?: FinancialFilters;
}

interface GetFinancialRecordsResponse {
  records: FinancialRecord[];
  total: number;
  byType: { type: string; total: number }[];
  byMonth: { month: string; total: number }[];
}

export class GetFinancialRecords {
  constructor(private repository: IFinancialRecordRepository) {}

  async execute(request: GetFinancialRecordsRequest): Promise<GetFinancialRecordsResponse> {
    const [records, total, byType, byMonth] = await Promise.all([
      this.repository.findAll(request.filters),
      this.repository.count(request.filters),
      this.repository.sumByType(request.filters),
      this.repository.sumByMonth(request.filters),
    ]);

    return { records, total, byType, byMonth };
  }
}

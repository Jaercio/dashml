import { IFinancialRecordRepository, UpdateFinancialRecordData } from '../repositories/IFinancialRecordRepository';
import { FinancialRecord } from '../entities/FinancialRecord';

export class UpdateFinancialRecord {
  constructor(private repository: IFinancialRecordRepository) {}

  async execute(id: string, data: UpdateFinancialRecordData): Promise<FinancialRecord> {
    if (!id) {
      throw new Error('ID do registro é obrigatório.');
    }

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Registro financeiro não encontrado.');
    }

    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('O valor deve ser maior que zero.');
    }

    return this.repository.update(id, data);
  }
}

import { IFinancialRecordRepository, CreateFinancialRecordData } from '../repositories/IFinancialRecordRepository';
import { FinancialRecord } from '../entities/FinancialRecord';

const VALID_TYPES = [
  'FIXED_COST', 'VARIABLE_COST', 'SALARY', 'RENT', 'ENERGY',
  'INTERNET', 'TAX', 'PACKAGING', 'LABEL', 'EXTRA_SHIPPING', 'OTHER'
];

export class CreateFinancialRecord {
  constructor(private repository: IFinancialRecordRepository) {}

  async execute(data: CreateFinancialRecordData): Promise<FinancialRecord> {
    if (!data.description || !data.type || !data.amount || !data.date) {
      throw new Error('Descrição, tipo, valor e data são obrigatórios.');
    }

    if (!VALID_TYPES.includes(data.type)) {
      throw new Error(`Tipo inválido. Tipos aceitos: ${VALID_TYPES.join(', ')}`);
    }

    if (data.amount <= 0) {
      throw new Error('O valor deve ser maior que zero.');
    }

    return this.repository.create(data);
  }
}

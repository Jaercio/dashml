import { IFinancialRecordRepository } from '../repositories/IFinancialRecordRepository';

export class DeleteFinancialRecord {
  constructor(private repository: IFinancialRecordRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID do registro é obrigatório.');
    }

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Registro financeiro não encontrado.');
    }

    await this.repository.delete(id);
  }
}

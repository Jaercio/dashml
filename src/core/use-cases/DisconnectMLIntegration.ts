import { PrismaMLIntegrationRepository } from '../../infrastructure/database/PrismaMLIntegrationRepository';

export class DisconnectMLIntegration {
  private mlIntegrationRepository: PrismaMLIntegrationRepository;

  constructor() {
    this.mlIntegrationRepository = new PrismaMLIntegrationRepository();
  }

  async execute(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await this.mlIntegrationRepository.findByUserId(userId);

      if (!integration) {
        return {
          success: false,
          error: 'Nenhuma integração encontrada',
        };
      }

      await this.mlIntegrationRepository.delete(integration.id);

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao desconectar ML:', error);
      return {
        success: false,
        error: error.message || 'Erro ao desconectar do Mercado Livre',
      };
    }
  }
}

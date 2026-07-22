import { PrismaMLIntegrationRepository } from '../../infrastructure/database/PrismaMLIntegrationRepository';
import { MercadoLivreService } from '../../infrastructure/services/MercadoLivreService';

interface ConnectResult {
  success: boolean;
  sellerId?: string;
  error?: string;
}

export class ConnectMLIntegration {
  private mlIntegrationRepository: PrismaMLIntegrationRepository;
  private mlService: MercadoLivreService;

  constructor() {
    this.mlIntegrationRepository = new PrismaMLIntegrationRepository();
    this.mlService = new MercadoLivreService();
  }

  async execute(userId: string, code: string): Promise<ConnectResult> {
    try {
      const tokenData = await this.mlService.exchangeCodeForToken(code);

      const userInfo = await this.mlService.getUserInfo(tokenData.access_token);
      const sellerId = String(userInfo.id);

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      const existingIntegration = await this.mlIntegrationRepository.findByUserId(userId);
      if (existingIntegration) {
        await this.mlIntegrationRepository.update(existingIntegration.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          sellerId,
        });
      } else {
        await this.mlIntegrationRepository.create({
          userId,
          sellerId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
        });
      }

      return {
        success: true,
        sellerId,
      };
    } catch (error: any) {
      console.error('Erro ao conectar ML:', error);
      return {
        success: false,
        error: error.message || 'Erro ao conectar com o Mercado Livre',
      };
    }
  }
}

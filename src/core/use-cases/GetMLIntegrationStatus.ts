import { PrismaMLIntegrationRepository } from '../../infrastructure/database/PrismaMLIntegrationRepository';
import { MercadoLivreService } from '../../infrastructure/services/MercadoLivreService';

interface IntegrationStatus {
  connected: boolean;
  sellerId?: string;
  sellerName?: string;
  syncedAt?: Date | null;
  expiresAt?: Date;
  isExpired?: boolean;
}

export class GetMLIntegrationStatus {
  private mlIntegrationRepository: PrismaMLIntegrationRepository;
  private mlService: MercadoLivreService;

  constructor() {
    this.mlIntegrationRepository = new PrismaMLIntegrationRepository();
    this.mlService = new MercadoLivreService();
  }

  async execute(userId: string): Promise<IntegrationStatus> {
    const integration = await this.mlIntegrationRepository.findByUserId(userId);

    if (!integration) {
      return { connected: false };
    }

    const isExpired = new Date() > integration.expiresAt;

    let sellerName: string | undefined;
    if (!isExpired) {
      try {
        const userInfo = await this.mlService.getUserInfo(integration.accessToken);
        sellerName = `${userInfo.first_name} ${userInfo.last_name}`;
      } catch {
        sellerName = undefined;
      }
    }

    return {
      connected: true,
      sellerId: integration.sellerId,
      sellerName,
      syncedAt: integration.syncedAt,
      expiresAt: integration.expiresAt,
      isExpired,
    };
  }
}

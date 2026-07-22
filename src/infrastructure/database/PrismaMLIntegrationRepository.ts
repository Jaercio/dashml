import { prisma } from '../../lib/prisma';

export interface MLIntegrationData {
  id: string;
  userId: string;
  sellerId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}

export class PrismaMLIntegrationRepository {
  async findByUserId(userId: string): Promise<MLIntegrationData | null> {
    const integration = await prisma.mLIntegration.findFirst({
      where: { userId },
    });
    return integration;
  }

  async findBySellerId(sellerId: string): Promise<MLIntegrationData | null> {
    const integration = await prisma.mLIntegration.findUnique({
      where: { sellerId },
    });
    return integration;
  }

  async create(data: {
    userId: string;
    sellerId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<MLIntegrationData> {
    const integration = await prisma.mLIntegration.create({
      data: {
        userId: data.userId,
        sellerId: data.sellerId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      },
    });
    return integration;
  }

  async update(
    id: string,
    data: Partial<{
      sellerId: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
      syncedAt: Date;
    }>
  ): Promise<MLIntegrationData> {
    const integration = await prisma.mLIntegration.update({
      where: { id },
      data,
    });
    return integration;
  }

  async delete(id: string): Promise<void> {
    await prisma.mLIntegration.delete({
      where: { id },
    });
  }

  async updateSyncTime(id: string): Promise<void> {
    await prisma.mLIntegration.update({
      where: { id },
      data: { syncedAt: new Date() },
    });
  }
}

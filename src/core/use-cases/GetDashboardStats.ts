import { IDashboardRepository, DashboardStats } from '../repositories/IDashboardRepository';

export class GetDashboardStats {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(): Promise<DashboardStats> {
    return this.dashboardRepository.getStats();
  }
}

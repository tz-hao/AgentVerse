import { AppDataSource } from '../database';
import { Agent } from '../models/Agent';
import { AgentTask } from '../models/AgentTask';
import { ReputationRecord } from '../models/ReputationRecord';

export interface ReputationSummary {
  reputationScore: number;
  successRate: number;
  averageRating: number;
  tasksCompleted: number;
  totalRevenue: number;
}

export class ReputationService {
  async getAgentReputationSummary(agentId: string): Promise<ReputationSummary> {
    const taskRepo = AppDataSource.getRepository(AgentTask);
    const reputationRepo = AppDataSource.getRepository(ReputationRecord);

    const tasks = await taskRepo.find({ where: { agent_id: agentId } });
    const reputationRecords = await reputationRepo.find({ where: { agent_id: agentId } });

    const completedTasks = tasks.filter((t) => t.status === 'success');
    const tasksCompleted = completedTasks.length;
    const totalTasks = tasks.length;

    const successRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    const ratedTasks = tasks.filter((t) => t.user_rating !== null);
    const averageRating =
      ratedTasks.length > 0
        ? ratedTasks.reduce((sum, t) => sum + (t.user_rating || 0), 0) / ratedTasks.length
        : 0;

    const totalRevenue = completedTasks.reduce((sum, t) => sum + Number(t.reward_amount), 0);

    const reputationScore = reputationRecords.reduce((sum, r) => sum + Number(r.score_delta), 0);

    return {
      reputationScore,
      successRate,
      averageRating,
      tasksCompleted,
      totalRevenue,
    };
  }

  async getDiscoveryData(category?: string, sortBy: string = 'reputationScore', limit: number = 20) {
    const agentRepo = AppDataSource.getRepository(Agent);
    const agents = await agentRepo.find({
      where: category ? { category: category as any } : {},
    });

    const agentsWithRep = await Promise.all(
      agents.map(async (agent) => {
        const summary = await this.getAgentReputationSummary(agent.id);
        return { ...agent, ...summary };
      })
    );

    // Sort by the specified field
    return agentsWithRep
      .sort((a: any, b: any) => (b[sortBy] || 0) - (a[sortBy] || 0))
      .slice(0, limit);
  }
}

export const reputationService = new ReputationService();

import { AppDataSource } from '../database';
import { Agent, AgentCategory } from '../models/Agent';
import { AgentTask, TaskStatus } from '../models/AgentTask';
import { TaskResult } from '../models/TaskResult';
import { PortfolioItem } from '../models/PortfolioItem';
import { ReputationRecord } from '../models/ReputationRecord';
import { RelationshipEdge, RelationshipType } from '../models/RelationshipEdge';
import { reputationService } from '../services/ReputationService';
import { web3Service } from '../services/Web3Service';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const agentResolvers = {
  // Query Resolvers
  agent: async ({ id }: { id: string }) => {
    return AppDataSource.getRepository(Agent).findOne({ where: { id } });
  },

  agents: async (args: any) => {
    const { first = 100, offset = 0, category } = args;
    const query = AppDataSource.getRepository(Agent).createQueryBuilder('agent');

    if (category) {
      query.andWhere('agent.category = :category', { category });
    }

    return query.orderBy('agent.created_at', 'DESC').skip(offset).take(first).getMany();
  },

  task: async ({ id }: { id: string }) => {
    return AppDataSource.getRepository(AgentTask).findOne({ where: { id } });
  },

  agentTasks: async ({ agent_id, status }: { agent_id: string; status?: TaskStatus }) => {
    const where: any = { agent_id };
    if (status) where.status = status;
    return AppDataSource.getRepository(AgentTask).find({
      where,
      order: { created_at: 'DESC' },
    });
  },

  portfolioItems: async ({ agent_id }: { agent_id: string }) => {
    return AppDataSource.getRepository(PortfolioItem).find({
      where: { agent_id },
      order: { created_at: 'DESC' },
    });
  },

  reputationRecords: async ({ agent_id }: { agent_id: string }) => {
    return AppDataSource.getRepository(ReputationRecord).find({
      where: { agent_id },
      order: { created_at: 'DESC' },
    });
  },

  discovery: async ({ category, sortBy, limit }: any) => {
    return reputationService.getDiscoveryData(category, sortBy, limit);
  },

  getReputationOnChain: async ({ agentId }: { agentId: string }) => {
    return web3Service.getReputation(agentId);
  },

  getTaskRecordOnChain: async ({ agentId, taskId }: { agentId: string; taskId: string }) => {
    return web3Service.getTaskRecord(agentId, taskId);
  },

  // Mutation Resolvers
  saveAgentProfile: async ({ agent: input }: any) => {
    const repo = AppDataSource.getRepository(Agent);
    let agent = await repo.findOne({ where: { id: input.id } });

    if (agent) {
      agent.did = input.did;
      agent.name = input.name;
      agent.category = input.category;
      agent.description = input.description;
      agent.skills = input.skills;
      agent.service_types = input.serviceTypes;
      agent.owner_address = input.ownerAddress;
      agent.collaborators = input.collaborators;
    } else {
      agent = repo.create({
        id: input.id,
        did: input.did,
        name: input.name,
        category: input.category,
        description: input.description,
        skills: input.skills,
        service_types: input.serviceTypes,
        owner_address: input.ownerAddress,
        collaborators: input.collaborators,
      });
    }

    return repo.save(agent);
  },

  saveAgentRun: async (args: any) => {
    const { agent, task, result, portfolioItem, reputationInput } = args;

    try {
      await AppDataSource.transaction(async (manager) => {
        // 1. Save/Update Agent
        let agentEntity = await manager.findOne(Agent, { where: { id: agent.id } });
        if (!agentEntity) {
          agentEntity = manager.create(Agent, {
            id: agent.id,
            did: agent.did,
            name: agent.name,
            category: agent.category,
            description: agent.description,
            skills: agent.skills,
            service_types: agent.serviceTypes,
            owner_address: agent.ownerAddress,
            collaborators: agent.collaborators,
          });
          await manager.save(agentEntity);
        }

        // 2. Save/Update Task
        let taskEntity = await manager.findOne(AgentTask, { where: { id: task.id } });
        if (!taskEntity) {
          taskEntity = manager.create(AgentTask, {
            id: task.id,
            agent_id: agent.id,
            title: task.title,
            description: task.description,
            category: task.category,
            input: task.input,
            reward_amount: task.rewardAmount,
            status: task.status as TaskStatus,
            user_rating: args.userRating || null,
          });
        } else {
          taskEntity.status = task.status as TaskStatus;
          if (args.userRating) taskEntity.user_rating = args.userRating;
        }
        await manager.save(taskEntity);

        // 3. Save Task Result
        const resultEntity = manager.create(TaskResult, {
          id: generateId('res'),
          task_id: result.taskId,
          agent_id: result.agentId,
          summary: result.summary,
          output: result.output,
          artifacts: result.artifacts,
          score_suggestion: result.scoreSuggestion,
          status: result.status,
          execution_mode: result.executionMode,
          completed_at: result.completedAt ? new Date(result.completedAt) : new Date(),
        });
        await manager.save(resultEntity);

        // 4. Save Portfolio Item
        const portfolioEntity = manager.create(PortfolioItem, {
          id: portfolioItem.id,
          agent_id: portfolioItem.agentId,
          task_id: portfolioItem.taskId,
          title: portfolioItem.title,
          summary: portfolioItem.summary,
          content: portfolioItem.content,
          artifacts: portfolioItem.artifacts,
          rating: portfolioItem.rating,
          evidence_hash: portfolioItem.evidenceHash,
          created_at: portfolioItem.createdAt ? new Date(portfolioItem.createdAt) : new Date(),
        });
        await manager.save(portfolioEntity);

        // 5. Save Reputation Record
        const reputationEntity = manager.create(ReputationRecord, {
          id: generateId('rep'),
          agent_id: reputationInput.agentId,
          task_id: reputationInput.taskId,
          success: reputationInput.success,
          user_rating: reputationInput.userRating,
          score_delta: reputationInput.scoreDelta,
          evidence: reputationInput.evidence,
          evidence_hash: reputationInput.evidenceHash,
          chain_status: 'not_submitted',
          contract_address: process.env.REPUTATION_CONTRACT_ADDRESS || '0x8c3e3d4C54CB8009798ebd04ad0811F25f05b2d7',
          chain: process.env.CHAIN_NAME || 'sepolia',
        });
        await manager.save(reputationEntity);
      });

      return { success: true, message: 'Agent run results synced successfully' };
    } catch (error: any) {
      console.error('Error syncing agent run:', error);
      return { success: false, message: error.message };
    }
  },

  confirmReputationOnChain: async ({ recordId, txHash, blockNumber }: any) => {
    const repo = AppDataSource.getRepository(ReputationRecord);
    const record = await repo.findOne({ where: { id: recordId } });
    if (!record) throw new Error('Reputation record not found');

    record.chain_status = 'confirmed';
    record.tx_hash = txHash;
    if (blockNumber) record.block_number = blockNumber;

    return repo.save(record);
  },

  updateReputationChainStatus: async ({ recordId, chainStatus, txHash }: any) => {
    const repo = AppDataSource.getRepository(ReputationRecord);
    const record = await repo.findOne({ where: { id: recordId } });
    if (!record) throw new Error('Reputation record not found');

    record.chain_status = chainStatus;
    if (txHash) record.tx_hash = txHash;

    return repo.save(record);
  },

  // Field Resolvers
  Agent: {
    tasks: async (parent: any) => {
      return AppDataSource.getRepository(AgentTask).find({
        where: { agent_id: parent.id },
        order: { created_at: 'DESC' },
      });
    },
    portfolio: async (parent: any) => {
      return AppDataSource.getRepository(PortfolioItem).find({
        where: { agent_id: parent.id },
        order: { created_at: 'DESC' },
      });
    },
    reputation_records: async (parent: any) => {
      return AppDataSource.getRepository(ReputationRecord).find({
        where: { agent_id: parent.id },
        order: { created_at: 'DESC' },
      });
    },
    reputation_summary: async (parent: any) => {
      return reputationService.getAgentReputationSummary(parent.id);
    },
  },

  AgentTask: {
    result: async (parent: any) => {
      return AppDataSource.getRepository(TaskResult).findOne({
        where: { task_id: parent.id },
      });
    },
  },
};

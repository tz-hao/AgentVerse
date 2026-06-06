import { In } from 'typeorm';
import { AppDataSource } from '../database';
import { EntityType, SbtNode } from '../models/SbtNode';
import {
  RelationshipEdge,
  RelationshipStrength,
  RelationshipType,
} from '../models/RelationshipEdge';

interface NodeQueryArgs {
  first?: number;
  offset?: number;
  entityType?: EntityType;
  isActive?: boolean;
}

interface RelationshipQueryArgs {
  first?: number;
  offset?: number;
  sourceNodeId?: string;
  targetNodeId?: string;
  relationshipType?: RelationshipType;
  isVerified?: boolean;
  isRevoked?: boolean;
}

interface SearchArgs {
  query: string;
  first?: number;
  offset?: number;
}

interface FindPathArgs {
  fromNodeId: string;
  toNodeId: string;
  maxDepth?: number;
}

interface GetEndorsedNodesArgs {
  endorserId: string;
  minStrength?: RelationshipStrength;
}

interface GetCollaboratorsArgs {
  nodeId: string;
  relationshipTypes?: RelationshipType[];
}

interface UpdateNodeMetadataArgs {
  id: string;
  displayName?: string;
  description?: string;
  attributes?: string;
}

interface RevokeRelationshipArgs {
  id: string;
  reason?: string;
}

const resolvers = {
  async node({ id }: { id: string }) {
    return AppDataSource.getRepository(SbtNode).findOne({ where: { id } });
  },

  async nodes(args: NodeQueryArgs) {
    const { first = 100, offset = 0, entityType, isActive } = args;
    const query = AppDataSource.getRepository(SbtNode).createQueryBuilder('node');

    if (entityType !== undefined) {
      query.andWhere('node.entityType = :entityType', { entityType });
    }

    if (isActive !== undefined) {
      query.andWhere('node.isActive = :isActive', { isActive });
    }

    return query.orderBy('node.createdAt', 'DESC').skip(offset).take(first).getMany();
  },

  async relationship({ id }: { id: string }) {
    return AppDataSource.getRepository(RelationshipEdge).findOne({ where: { id } });
  },

  async relationships(args: RelationshipQueryArgs) {
    const {
      first = 100,
      offset = 0,
      sourceNodeId,
      targetNodeId,
      relationshipType,
      isVerified,
      isRevoked,
    } = args;
    const query = AppDataSource.getRepository(RelationshipEdge).createQueryBuilder('edge');

    if (sourceNodeId) {
      query.andWhere('edge.sourceNodeId = :sourceNodeId', { sourceNodeId });
    }

    if (targetNodeId) {
      query.andWhere('edge.targetNodeId = :targetNodeId', { targetNodeId });
    }

    if (relationshipType) {
      query.andWhere('edge.relationshipType = :relationshipType', { relationshipType });
    }

    if (isVerified !== undefined) {
      query.andWhere('edge.isVerified = :isVerified', { isVerified });
    }

    if (isRevoked !== undefined) {
      query.andWhere('edge.isRevoked = :isRevoked', { isRevoked });
    }

    return query.orderBy('edge.createdAt', 'DESC').skip(offset).take(first).getMany();
  },

  async searchNodes(args: SearchArgs) {
    const { query, first = 100, offset = 0 } = args;
    const searchPattern = `%${query}%`;

    return AppDataSource.getRepository(SbtNode)
      .createQueryBuilder('node')
      .where('LOWER(node.displayName) LIKE LOWER(:pattern)', { pattern: searchPattern })
      .orWhere('LOWER(node.description) LIKE LOWER(:pattern)', { pattern: searchPattern })
      .orWhere('LOWER(node.id) LIKE LOWER(:pattern)', { pattern: searchPattern })
      .orderBy('node.createdAt', 'DESC')
      .skip(offset)
      .take(first)
      .getMany();
  },

  async getGraphStats() {
    const nodeRepo = AppDataSource.getRepository(SbtNode);
    const edgeRepo = AppDataSource.getRepository(RelationshipEdge);
    const [totalNodes, totalEdges, activeNodes, verifiedEdges] = await Promise.all([
      nodeRepo.count(),
      edgeRepo.count(),
      nodeRepo.count({ where: { isActive: true } }),
      edgeRepo.count({ where: { isVerified: true, isRevoked: false } }),
    ]);

    return { totalNodes, totalEdges, activeNodes, verifiedEdges };
  },

  async findPath(args: FindPathArgs) {
    const { fromNodeId, toNodeId, maxDepth = 5 } = args;
    const nodeRepo = AppDataSource.getRepository(SbtNode);
    const edgeRepo = AppDataSource.getRepository(RelationshipEdge);

    if (fromNodeId === toNodeId) {
      const node = await nodeRepo.findOne({ where: { id: fromNodeId } });
      return node ? [[node]] : [];
    }

    const startNode = await nodeRepo.findOne({ where: { id: fromNodeId } });
    if (!startNode) {
      return [];
    }

    const visited = new Set<string>([fromNodeId]);
    const queue: Array<{ nodeId: string; path: SbtNode[] }> = [{ nodeId: fromNodeId, path: [startNode] }];
    const paths: SbtNode[][] = [];

    while (queue.length > 0 && paths.length < 10) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      if (current.path.length > maxDepth) {
        continue;
      }

      const outgoingEdges = await edgeRepo.find({
        where: { sourceNodeId: current.nodeId, isRevoked: false },
      });

      for (const edge of outgoingEdges) {
        if (visited.has(edge.targetNodeId)) {
          continue;
        }

        const targetNode = await nodeRepo.findOne({ where: { id: edge.targetNodeId } });
        if (!targetNode) {
          continue;
        }

        const newPath = [...current.path, targetNode];
        if (edge.targetNodeId === toNodeId) {
          paths.push(newPath);
          continue;
        }

        visited.add(edge.targetNodeId);
        queue.push({ nodeId: edge.targetNodeId, path: newPath });
      }
    }

    return paths;
  },

  async getEndorsedNodes(args: GetEndorsedNodesArgs) {
    const { endorserId, minStrength = RelationshipStrength.WEAK } = args;
    const edgeRepo = AppDataSource.getRepository(RelationshipEdge);
    const nodeRepo = AppDataSource.getRepository(SbtNode);
    const edges = await edgeRepo.find({
      where: {
        sourceNodeId: endorserId,
        relationshipType: RelationshipType.BUSINESS_ENDORSEMENT,
        isRevoked: false,
      },
    });

    const allowedStrengths =
      minStrength === RelationshipStrength.STRONG
        ? [RelationshipStrength.STRONG]
        : minStrength === RelationshipStrength.MEDIUM
          ? [RelationshipStrength.MEDIUM, RelationshipStrength.STRONG]
          : [RelationshipStrength.WEAK, RelationshipStrength.MEDIUM, RelationshipStrength.STRONG];

    const targetIds = edges
      .filter((edge) => allowedStrengths.includes(edge.strength))
      .map((edge) => edge.targetNodeId);

    if (targetIds.length === 0) {
      return [];
    }

    return nodeRepo.find({ where: { id: In(targetIds) } });
  },

  async getCollaborators(args: GetCollaboratorsArgs) {
    const { nodeId, relationshipTypes } = args;
    const edgeRepo = AppDataSource.getRepository(RelationshipEdge);
    const nodeRepo = AppDataSource.getRepository(SbtNode);
    const query = edgeRepo
      .createQueryBuilder('edge')
      .where('(edge.sourceNodeId = :nodeId OR edge.targetNodeId = :nodeId)', { nodeId })
      .andWhere('edge.isRevoked = false');

    if (relationshipTypes && relationshipTypes.length > 0) {
      query.andWhere('edge.relationshipType IN (:...types)', { types: relationshipTypes });
    }

    const edges = await query.getMany();
    const ids = new Set<string>();

    for (const edge of edges) {
      ids.add(edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId);
    }

    if (ids.size === 0) {
      return [];
    }

    return nodeRepo.find({ where: { id: In([...ids]) } });
  },

  async revokeRelationship(args: RevokeRelationshipArgs) {
    const repo = AppDataSource.getRepository(RelationshipEdge);
    const { id, reason } = args;

    await repo.update(
      { id },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: reason ?? null,
      }
    );

    return repo.findOne({ where: { id } });
  },

  async updateNodeMetadata(args: UpdateNodeMetadataArgs) {
    const repo = AppDataSource.getRepository(SbtNode);
    const { id, displayName, description, attributes } = args;
    const updateData: Partial<SbtNode> = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (attributes !== undefined) {
      try {
        updateData.attributes = JSON.parse(attributes) as Record<string, unknown>;
      } catch {
        updateData.attributes = { value: attributes };
      }
    }

    await repo.update({ id }, updateData);
    return repo.findOne({ where: { id } });
  },

  async outgoingRelationships(parent: SbtNode) {
    return AppDataSource.getRepository(RelationshipEdge).find({
      where: { sourceNodeId: parent.id, isRevoked: false },
    });
  },

  async incomingRelationships(parent: SbtNode) {
    return AppDataSource.getRepository(RelationshipEdge).find({
      where: { targetNodeId: parent.id, isRevoked: false },
    });
  },

  async sourceNode(parent: RelationshipEdge) {
    return AppDataSource.getRepository(SbtNode).findOne({
      where: { id: parent.sourceNodeId },
    });
  },

  async targetNode(parent: RelationshipEdge) {
    return AppDataSource.getRepository(SbtNode).findOne({
      where: { id: parent.targetNodeId },
    });
  },
};

export { resolvers };

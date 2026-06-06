import { In } from 'typeorm';
import { AppDataSource } from '../database';
import { SbtNode } from '../models/SbtNode';
import { RelationshipEdge } from '../models/RelationshipEdge';

export interface RDFTriple {
  subject: string;
  predicate: string;
  object: string;
}

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  triples: RDFTriple[];
}

class GraphService {
  async buildKnowledgeGraph(): Promise<KnowledgeGraph> {
    const nodeRepo = AppDataSource.getRepository(SbtNode);
    const edgeRepo = AppDataSource.getRepository(RelationshipEdge);
    const [nodes, edges] = await Promise.all([
      nodeRepo.find({ where: { isActive: true } }),
      edgeRepo.find({ where: { isRevoked: false } }),
    ]);

    const graphNodes: GraphNode[] = nodes.map((node) => ({
      id: this.formatNodeUri(node.id),
      type: `sovereigngraph:${node.entityType}`,
      properties: {
        id: node.id,
        owner: node.owner,
        displayName: node.displayName,
        description: node.description,
        metadataUri: node.metadataUri,
        attributes: node.attributes,
        createdAt: node.createdAt.toISOString(),
      },
    }));

    const graphEdges: GraphEdge[] = edges.map((edge) => ({
      id: this.formatEdgeUri(edge.id),
      source: this.formatNodeUri(edge.sourceNodeId),
      target: this.formatNodeUri(edge.targetNodeId),
      type: `sovereigngraph:${edge.relationshipType}`,
      properties: {
        id: edge.id,
        strength: edge.strength,
        isVerified: edge.isVerified,
        zkProof: edge.zkProof,
        createdAt: edge.createdAt.toISOString(),
      },
    }));

    const triples: RDFTriple[] = [];

    for (const node of graphNodes) {
      triples.push({
        subject: node.id,
        predicate: 'rdf:type',
        object: node.type,
      });

      for (const [key, value] of Object.entries(node.properties)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            triples.push({
              subject: node.id,
              predicate: `sovereigngraph:${key}`,
              object: String(value),
            });
          }
        }
      }
    }

    for (const edge of graphEdges) {
      triples.push({
        subject: edge.source,
        predicate: edge.type,
        object: edge.target,
      });

      triples.push({
        subject: edge.id,
        predicate: 'rdf:type',
        object: 'sovereigngraph:RelationshipEdge',
      });

      triples.push({
        subject: edge.id,
        predicate: 'sovereigngraph:strength',
        object: edge.properties.strength,
      });
    }

    return { nodes: graphNodes, edges: graphEdges, triples };
  }

  formatNodeUri(nodeId: string): string {
    return `urn:sovereigngraph:node:${nodeId}`;
  }

  formatEdgeUri(edgeId: string): string {
    return `urn:sovereigngraph:edge:${edgeId}`;
  }

  async getSubgraph(
    centerNodeId: string,
    depth: number = 2
  ): Promise<KnowledgeGraph> {
    const visited = new Set<string>();
    const nodesToProcess: string[] = [centerNodeId];
    const resultNodes: SbtNode[] = [];
    const resultEdges: RelationshipEdge[] = [];
    const nodeRepo = AppDataSource.getRepository(SbtNode);
    const edgeRepo = AppDataSource.getRepository(RelationshipEdge);

    for (let currentDepth = 0; currentDepth < depth && nodesToProcess.length > 0; currentDepth++) {
      const currentNodes = [...new Set(nodesToProcess)];
      nodesToProcess.length = 0;

      const nodes = await nodeRepo.find({
        where: { id: In(currentNodes) },
      });

      resultNodes.push(...nodes);

      const edges = await edgeRepo
        .createQueryBuilder('edge')
        .where('(edge.sourceNodeId IN (:...ids) OR edge.targetNodeId IN (:...ids))', { ids: currentNodes })
        .andWhere('edge.isRevoked = false')
        .getMany();

      resultEdges.push(...edges);

      for (const edge of edges) {
        if (!visited.has(edge.sourceNodeId) && !currentNodes.includes(edge.sourceNodeId)) {
          nodesToProcess.push(edge.sourceNodeId);
        }
        if (!visited.has(edge.targetNodeId) && !currentNodes.includes(edge.targetNodeId)) {
          nodesToProcess.push(edge.targetNodeId);
        }
      }

      currentNodes.forEach((id) => visited.add(id));
    }

    const graphNodes: GraphNode[] = resultNodes.map((node) => ({
      id: this.formatNodeUri(node.id),
      type: `sovereigngraph:${node.entityType}`,
      properties: {
        id: node.id,
        owner: node.owner,
        displayName: node.displayName,
        description: node.description,
        createdAt: node.createdAt.toISOString(),
      },
    }));

    const graphEdges: GraphEdge[] = resultEdges.map((edge) => ({
      id: this.formatEdgeUri(edge.id),
      source: this.formatNodeUri(edge.sourceNodeId),
      target: this.formatNodeUri(edge.targetNodeId),
      type: `sovereigngraph:${edge.relationshipType}`,
      properties: {
        id: edge.id,
        strength: edge.strength,
        isVerified: edge.isVerified,
      },
    }));

    const triples: RDFTriple[] = [];

    for (const node of graphNodes) {
      triples.push({
        subject: node.id,
        predicate: 'rdf:type',
        object: node.type,
      });
    }

    for (const edge of graphEdges) {
      triples.push({
        subject: edge.source,
        predicate: edge.type,
        object: edge.target,
      });
    }

    return { nodes: graphNodes, edges: graphEdges, triples };
  }

  async exportToTurtle(): Promise<string> {
    const graph = await this.buildKnowledgeGraph();
    let turtle = '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n';
    turtle += '@prefix sovereigngraph: <urn:sovereigngraph:> .\n\n';

    for (const triple of graph.triples) {
      const escapedObject = triple.object.includes(':') || triple.object.includes(' ')
        ? `"${triple.object}"` : triple.object;
      turtle += `${triple.subject} ${triple.predicate} ${escapedObject} .\n`;
    }

    return turtle;
  }
}

export const graphService = new GraphService();

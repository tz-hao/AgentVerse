import { AppDataSource } from '../database';
import { EntityType, SbtNode } from '../models/SbtNode';
import {
  RelationshipEdge,
  RelationshipStrength,
  RelationshipType,
} from '../models/RelationshipEdge';

const demoNodes: Array<Partial<SbtNode> & Pick<SbtNode, 'id' | 'owner' | 'entityType' | 'isActive' | 'blockNumber' | 'transactionHash'>> = [
  {
    id: 'agent_research_gpt_001',
    owner: '0xResearchGPT',
    entityType: EntityType.AI_AGENT,
    metadataUri: 'agent://research-gpt-001',
    displayName: 'ResearchGPT',
    description: 'Senior Research Agent',
    attributes: { skills: ['Token Research', 'Onchain Analysis', 'Risk Assessment'] },
    isActive: true,
    blockNumber: 'demo',
    transactionHash: 'demo-research',
  },
  {
    id: 'agent_audit_gpt_001',
    owner: '0xAuditGPT',
    entityType: EntityType.AI_AGENT,
    metadataUri: 'agent://audit-gpt-001',
    displayName: 'AuditGPT',
    description: 'Smart contract security auditor',
    attributes: { skills: ['Smart Contract Audit', 'Threat Modeling', 'Risk Severity'] },
    isActive: true,
    blockNumber: 'demo',
    transactionHash: 'demo-audit',
  },
  {
    id: 'agent_risk_gpt_001',
    owner: '0xRiskGPT',
    entityType: EntityType.AI_AGENT,
    metadataUri: 'agent://risk-gpt-001',
    displayName: 'RiskGPT',
    description: 'Protocol risk assessment agent',
    attributes: { skills: ['Risk Assessment', 'Scenario Analysis', 'Exposure Mapping'] },
    isActive: true,
    blockNumber: 'demo',
    transactionHash: 'demo-risk',
  },
  {
    id: 'agent_market_gpt_001',
    owner: '0xMarketGPT',
    entityType: EntityType.AI_AGENT,
    metadataUri: 'agent://market-gpt-001',
    displayName: 'MarketGPT',
    description: 'Web3 market analysis agent',
    attributes: { skills: ['Market Analysis', 'Narrative Tracking', 'Growth Strategy'] },
    isActive: true,
    blockNumber: 'demo',
    transactionHash: 'demo-market',
  },
];

const demoRelationships: Array<
  Partial<RelationshipEdge> &
    Pick<
      RelationshipEdge,
      | 'id'
      | 'sourceNodeId'
      | 'targetNodeId'
      | 'relationshipType'
      | 'strength'
      | 'isVerified'
      | 'isRevoked'
      | 'creator'
      | 'blockNumber'
      | 'transactionHash'
    >
> = [
  {
    id: 'demo-research-audit',
    sourceNodeId: 'agent_research_gpt_001',
    targetNodeId: 'agent_audit_gpt_001',
    relationshipType: RelationshipType.TEAM_FORMATION,
    strength: RelationshipStrength.STRONG,
    isVerified: true,
    isRevoked: false,
    creator: '0xResearchGPT',
    blockNumber: 'demo',
    transactionHash: 'demo-edge-audit',
  },
  {
    id: 'demo-research-risk',
    sourceNodeId: 'agent_research_gpt_001',
    targetNodeId: 'agent_risk_gpt_001',
    relationshipType: RelationshipType.REPUTATION_SHARE,
    strength: RelationshipStrength.STRONG,
    isVerified: true,
    isRevoked: false,
    creator: '0xResearchGPT',
    blockNumber: 'demo',
    transactionHash: 'demo-edge-risk',
  },
  {
    id: 'demo-research-market',
    sourceNodeId: 'agent_research_gpt_001',
    targetNodeId: 'agent_market_gpt_001',
    relationshipType: RelationshipType.SOCIAL_GRAPH,
    strength: RelationshipStrength.MEDIUM,
    isVerified: true,
    isRevoked: false,
    creator: '0xResearchGPT',
    blockNumber: 'demo',
    transactionHash: 'demo-edge-market',
  },
];

export async function seedDiscoveryDemoDataIfEmpty(): Promise<void> {
  const nodeRepo = AppDataSource.getRepository(SbtNode);
  const existingNodes = await nodeRepo.count();

  if (existingNodes > 0) {
    return;
  }

  await nodeRepo.save(
    demoNodes.map((node) =>
      nodeRepo.create({
        ...node,
        updatedAt: null,
      }),
    ),
  );

  const edgeRepo = AppDataSource.getRepository(RelationshipEdge);
  await edgeRepo.save(
    demoRelationships.map((relationship) =>
      edgeRepo.create({
        ...relationship,
        zkProof: null,
        encryptedMetadata: null,
        revokedAt: null,
        revocationReason: null,
      }),
    ),
  );

  console.log('[Discovery Seed] Inserted demo Agent discovery graph');
}

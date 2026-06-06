export const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

export type DiscoveryNode = {
  id: string;
  owner: string;
  entityType: "HUMAN" | "AI_AGENT" | "ORGANIZATION";
  metadataUri: string | null;
  displayName: string | null;
  description: string | null;
  isActive: boolean;
  transactionHash: string;
  createdAt: string;
};

export type DiscoveryRelationship = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType:
    | "TEAM_FORMATION"
    | "CODE_CONTRIBUTION"
    | "BUSINESS_ENDORSEMENT"
    | "SOCIAL_GRAPH"
    | "REPUTATION_SHARE";
  strength: "WEAK" | "MEDIUM" | "STRONG";
  isVerified: boolean;
  isRevoked: boolean;
  creator: string;
};

export type DiscoveryGraphStats = {
  totalNodes: number;
  totalEdges: number;
  activeNodes: number;
  verifiedEdges: number;
};

export type DiscoverySnapshot = {
  nodes: DiscoveryNode[];
  relationships: DiscoveryRelationship[];
  graphStats: DiscoveryGraphStats;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const nodeFields = `
  id
  owner
  entityType
  metadataUri
  displayName
  description
  isActive
  transactionHash
  createdAt
`;

export async function fetchDiscoverySnapshot(): Promise<DiscoverySnapshot> {
  return requestGraphql<DiscoverySnapshot>(`
    query DiscoverySnapshot {
      nodes(first: 50, isActive: true) {
        ${nodeFields}
      }
      relationships(first: 50, isRevoked: false) {
        id
        sourceNodeId
        targetNodeId
        relationshipType
        strength
        isVerified
        isRevoked
        creator
      }
      graphStats: getGraphStats {
        totalNodes
        totalEdges
        activeNodes
        verifiedEdges
      }
    }
  `);
}

export async function searchDiscoveryNodes(query: string): Promise<DiscoveryNode[]> {
  const response = await requestGraphql<{ searchNodes: DiscoveryNode[] }>(
    `
      query SearchNodes($query: String!) {
        searchNodes(query: $query, first: 50) {
          ${nodeFields}
        }
      }
    `,
    { query },
  );

  return response.searchNodes;
}

async function requestGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response did not include data.");
  }

  return payload.data;
}

export const fallbackDiscoverySnapshot: DiscoverySnapshot = {
  nodes: [
    {
      id: "agent_research_gpt_001",
      owner: "0xResearchGPT",
      entityType: "AI_AGENT",
      metadataUri: "agent://research-gpt-001",
      displayName: "ResearchGPT",
      description: "Senior Research Agent",
      isActive: true,
      transactionHash: "demo-research",
      createdAt: "demo",
    },
    {
      id: "agent_audit_gpt_001",
      owner: "0xAuditGPT",
      entityType: "AI_AGENT",
      metadataUri: "agent://audit-gpt-001",
      displayName: "AuditGPT",
      description: "Smart contract security auditor",
      isActive: true,
      transactionHash: "demo-audit",
      createdAt: "demo",
    },
    {
      id: "agent_risk_gpt_001",
      owner: "0xRiskGPT",
      entityType: "AI_AGENT",
      metadataUri: "agent://risk-gpt-001",
      displayName: "RiskGPT",
      description: "Protocol risk assessment agent",
      isActive: true,
      transactionHash: "demo-risk",
      createdAt: "demo",
    },
    {
      id: "agent_market_gpt_001",
      owner: "0xMarketGPT",
      entityType: "AI_AGENT",
      metadataUri: "agent://market-gpt-001",
      displayName: "MarketGPT",
      description: "Web3 market analysis agent",
      isActive: true,
      transactionHash: "demo-market",
      createdAt: "demo",
    },
  ],
  relationships: [
    {
      id: "demo-research-audit",
      sourceNodeId: "agent_research_gpt_001",
      targetNodeId: "agent_audit_gpt_001",
      relationshipType: "TEAM_FORMATION",
      strength: "STRONG",
      isVerified: true,
      isRevoked: false,
      creator: "0xResearchGPT",
    },
    {
      id: "demo-research-risk",
      sourceNodeId: "agent_research_gpt_001",
      targetNodeId: "agent_risk_gpt_001",
      relationshipType: "REPUTATION_SHARE",
      strength: "STRONG",
      isVerified: true,
      isRevoked: false,
      creator: "0xResearchGPT",
    },
    {
      id: "demo-research-market",
      sourceNodeId: "agent_research_gpt_001",
      targetNodeId: "agent_market_gpt_001",
      relationshipType: "SOCIAL_GRAPH",
      strength: "MEDIUM",
      isVerified: true,
      isRevoked: false,
      creator: "0xResearchGPT",
    },
  ],
  graphStats: {
    totalNodes: 4,
    totalEdges: 3,
    activeNodes: 4,
    verifiedEdges: 3,
  },
};

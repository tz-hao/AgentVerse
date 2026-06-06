export const typeDefs = `
  enum EntityType {
    HUMAN
    AI_AGENT
    ORGANIZATION
  }

  enum RelationshipType {
    TEAM_FORMATION
    CODE_CONTRIBUTION
    BUSINESS_ENDORSEMENT
    SOCIAL_GRAPH
    REPUTATION_SHARE
  }

  enum RelationshipStrength {
    WEAK
    MEDIUM
    STRONG
  }

  type SbtNode {
    id: String!
    owner: String!
    entityType: EntityType!
    metadataUri: String
    displayName: String
    description: String
    attributes: String
    isActive: Boolean!
    blockNumber: String!
    transactionHash: String!
    createdAt: String!
    updatedAt: String

    outgoingRelationships: [RelationshipEdge!]!
    incomingRelationships: [RelationshipEdge!]!
  }

  type RelationshipEdge {
    id: String!
    sourceNodeId: String!
    targetNodeId: String!
    relationshipType: RelationshipType!
    strength: RelationshipStrength!
    zkProof: String
    encryptedMetadata: String
    isVerified: Boolean!
    isRevoked: Boolean!
    creator: String!
    blockNumber: String!
    transactionHash: String!
    createdAt: String!
    revokedAt: String
    revocationReason: String

    sourceNode: SbtNode
    targetNode: SbtNode
  }

  type GraphStats {
    totalNodes: Int!
    totalEdges: Int!
    activeNodes: Int!
    verifiedEdges: Int!
  }

  extend type Query {
    node(id: String!): SbtNode
    nodes(
      first: Int
      offset: Int
      entityType: EntityType
      isActive: Boolean
    ): [SbtNode!]!

    relationship(id: String!): RelationshipEdge
    relationships(
      first: Int
      offset: Int
      sourceNodeId: String
      targetNodeId: String
      relationshipType: RelationshipType
      isVerified: Boolean
      isRevoked: Boolean
    ): [RelationshipEdge!]!

    searchNodes(
      query: String!
      first: Int
      offset: Int
    ): [SbtNode!]!

    getGraphStats: GraphStats!

    findPath(
      fromNodeId: String!
      toNodeId: String!
      maxDepth: Int
    ): [[SbtNode!]!]!

    getEndorsedNodes(
      endorserId: String!
      minStrength: RelationshipStrength
    ): [SbtNode!]!

    getCollaborators(
      nodeId: String!
      relationshipTypes: [RelationshipType!]
    ): [SbtNode!]!
  }

  extend type Mutation {
    revokeRelationship(
      id: String!
      reason: String
    ): RelationshipEdge!

    updateNodeMetadata(
      id: String!
      displayName: String
      description: String
      attributes: String
    ): SbtNode!
  }
`;

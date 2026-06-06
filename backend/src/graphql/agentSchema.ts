export const agentTypeDefs = `
  enum AgentCategory {
    Research
    Coding
    Audit
    Trading
    Marketing
    CustomerService
  }

  enum TaskStatus {
    pending
    running
    success
    failed
  }

  type Agent {
    id: String!
    did: String!
    name: String!
    category: AgentCategory!
    description: String
    skills: [String!]
    service_types: [String!]
    owner_address: String!
    collaborators: [String!]
    created_at: String!
    updated_at: String!

    tasks: [AgentTask!]
    portfolio: [PortfolioItem!]
    reputation_records: [ReputationRecord!]
    reputation_summary: ReputationSummary
  }

  type ReputationSummary {
    reputationScore: Float!
    successRate: Float!
    averageRating: Float!
    tasksCompleted: Int!
    totalRevenue: Float!
  }

  type AgentTask {
    id: String!
    agent_id: String!
    title: String!
    description: String
    category: String!
    input: String
    reward_amount: Float!
    status: TaskStatus!
    user_rating: Float
    created_at: String!
    updated_at: String!

    result: TaskResult
  }

  type TaskResult {
    id: String!
    task_id: String!
    agent_id: String!
    summary: String
    output: String
    artifacts: [String!]
    score_suggestion: Float
    status: String!
    execution_mode: String!
    completed_at: String
    created_at: String!
  }

  type PortfolioItem {
    id: String!
    agent_id: String!
    task_id: String!
    title: String!
    summary: String
    content: String
    artifacts: [String!]
    rating: Float
    evidence_hash: String
    created_at: String!
  }

  type ReputationRecord {
    id: String!
    agent_id: String!
    task_id: String!
    success: Boolean!
    user_rating: Float
    score_delta: Float!
    evidence: String
    evidence_hash: String
    chain_status: String!
    tx_hash: String
    contract_address: String
    chain: String
    block_number: Int
    created_at: String!
  }

  type OnChainReputation {
    score: Float!
    completedTasks: Int!
    successfulTasks: Int!
    averageRating: Float!
  }

  type OnChainTaskRecord {
    success: Boolean!
    userRating: Float!
    scoreDelta: Float!
    evidenceHash: String!
    timestamp: String!
  }

  input AgentInput {
    id: String!
    did: String!
    name: String!
    category: AgentCategory!
    description: String
    skills: [String!]
    serviceTypes: [String!]
    ownerAddress: String!
    collaborators: [String!]
  }

  input TaskInput {
    id: String!
    title: String!
    description: String
    category: String!
    input: String
    rewardAmount: Float!
    status: String!
    createdAt: String
  }

  input TaskResultInput {
    taskId: String!
    agentId: String!
    summary: String
    output: String!
    artifacts: [String!]
    scoreSuggestion: Float
    status: String!
    executionMode: String!
    completedAt: String
  }

  input PortfolioItemInput {
    id: String!
    agentId: String!
    taskId: String!
    title: String!
    summary: String
    content: String!
    artifacts: [String!]
    rating: Float
    evidenceHash: String
    createdAt: String
  }

  input ReputationInput {
    agentId: String!
    taskId: String!
    success: Boolean!
    userRating: Float
    scoreDelta: Float!
    evidence: String
    evidenceHash: String
  }

  type SyncResult {
    success: Boolean!
    message: String
  }

  type Query {
    agent(id: String!): Agent
    agents(
      first: Int
      offset: Int
      category: AgentCategory
    ): [Agent!]!

    task(id: String!): AgentTask
    agentTasks(agent_id: String!, status: TaskStatus): [AgentTask!]!

    portfolioItems(agent_id: String!): [PortfolioItem!]!
    reputationRecords(agent_id: String!): [ReputationRecord!]!

    discovery(
      category: AgentCategory
      sortBy: String
      limit: Int
    ): [Agent!]!

    getReputationOnChain(agentId: String!): OnChainReputation
    getTaskRecordOnChain(agentId: String!, taskId: String!): OnChainTaskRecord
  }

  type Mutation {
    saveAgentProfile(agent: AgentInput!): Agent!

    saveAgentRun(
      agent: AgentInput!
      task: TaskInput!
      result: TaskResultInput!
      portfolioItem: PortfolioItemInput!
      reputationInput: ReputationInput!
    ): SyncResult!

    confirmReputationOnChain(
      recordId: String!
      txHash: String!
      blockNumber: Int
    ): ReputationRecord!

    updateReputationChainStatus(
      recordId: String!
      chainStatus: String!
      txHash: String
    ): ReputationRecord!
  }
`;

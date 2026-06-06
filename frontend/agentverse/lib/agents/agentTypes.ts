export type AgentCategory =
  | "Research"
  | "Coding"
  | "Audit"
  | "Trading"
  | "Marketing"
  | "CustomerService";

export type AgentProfile = {
  id: string;
  did: string;
  name: string;
  category: AgentCategory;
  description: string;
  skills: string[];
  serviceTypes: string[];
  ownerAddress: string;
  collaborators: string[];
};

export type AgentTaskStatus = "pending" | "running" | "success" | "failed";
export type AgentExecutionMode = "deepseek" | "fallback";

export type AgentTask = {
  id: string;
  title: string;
  description: string;
  category: AgentCategory;
  input: string;
  rewardAmount: number;
  status: AgentTaskStatus;
  createdAt: string;
};

export type AgentTaskResult = {
  taskId: string;
  agentId: string;
  summary: string;
  output: string;
  artifacts: string[];
  scoreSuggestion: number;
  status: AgentTaskStatus;
  executionMode: AgentExecutionMode;
  completedAt: string;
};

export type PortfolioItem = {
  id: string;
  agentId: string;
  taskId: string;
  title: string;
  summary: string;
  content: string;
  artifacts: string[];
  rating: number | null;
  evidenceHash: string;
  createdAt: string;
};

export type ReputationInput = {
  agentId: string;
  taskId: string;
  success: boolean;
  userRating: number;
  scoreDelta: number;
  evidence: string;
  evidenceHash: string;
};

export type AgentProfileView = {
  profile: AgentProfile;
  reputationScore: number;
  successRate: number;
  completedTasks: number;
  totalRevenue: number;
  portfolio: PortfolioItem[];
  collaborators: string[];
};

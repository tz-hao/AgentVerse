import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AgentProfile,
  AgentTask,
  AgentTaskResult,
  PortfolioItem,
  ReputationInput,
} from "../lib/agents/agentTypes";
import { buildReputationInput } from "../lib/agents/reputationInput";
import { createPortfolioItem } from "../lib/agents/portfolio";
import { runAgentTask } from "../lib/agents/taskRunner";
import { POST } from "../app/api/agent/run/route";

vi.mock("../lib/agents/taskRunner", () => ({
  runAgentTask: vi.fn(),
}));

vi.mock("../lib/agents/portfolio", () => ({
  createPortfolioItem: vi.fn(),
}));

vi.mock("../lib/agents/reputationInput", () => ({
  buildReputationInput: vi.fn(),
}));

const agent: AgentProfile = {
  id: "agent_research_001",
  did: "agent://research-gpt-001",
  name: "ResearchGPT",
  category: "Research",
  description: "Research agent.",
  skills: ["research"],
  serviceTypes: ["research-report"],
  ownerAddress: "0x123",
  collaborators: [],
};

const task: AgentTask = {
  id: "task_001",
  title: "Analyze Hyperliquid",
  description: "Research task.",
  category: "Research",
  input: "Analyze Hyperliquid.",
  rewardAmount: 20,
  status: "pending",
  createdAt: "2026-06-02T00:00:00.000Z",
};

const result: AgentTaskResult = {
  taskId: task.id,
  agentId: agent.id,
  summary: "Research completed.",
  output: "# Research",
  artifacts: ["Research Report"],
  scoreSuggestion: 4,
  status: "success",
  executionMode: "deepseek",
  completedAt: "2026-06-02T01:00:00.000Z",
};

const portfolioItem: PortfolioItem = {
  id: "portfolio_001",
  agentId: agent.id,
  taskId: task.id,
  title: task.title,
  summary: result.summary,
  content: result.output,
  artifacts: result.artifacts,
  rating: 5,
  evidenceHash: "evidence_hash_001",
  createdAt: result.completedAt,
};

const reputationInput: ReputationInput = {
  agentId: agent.id,
  taskId: task.id,
  success: true,
  userRating: 5,
  scoreDelta: 9,
  evidence: result.summary,
  evidenceHash: portfolioItem.evidenceHash,
};

describe("POST /api/agent/run", () => {
  beforeEach(() => {
    vi.mocked(runAgentTask).mockReset();
    vi.mocked(createPortfolioItem).mockReset();
    vi.mocked(buildReputationInput).mockReset();
  });

  it("runs an agent task and returns result, portfolio item, and reputation input", async () => {
    vi.mocked(runAgentTask).mockResolvedValue(result);
    vi.mocked(createPortfolioItem).mockReturnValue(portfolioItem);
    vi.mocked(buildReputationInput).mockReturnValue(reputationInput);

    const response = await POST(jsonRequest({ agent, task, userRating: 5 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(runAgentTask).toHaveBeenCalledWith(agent, task);
    expect(createPortfolioItem).toHaveBeenCalledWith(agent, task, result, 5);
    expect(buildReputationInput).toHaveBeenCalledWith(result, 5, portfolioItem.evidenceHash);
    expect(body).toEqual({ result, portfolioItem, reputationInput });
    expect(JSON.stringify(body)).not.toContain("DEEPSEEK_API_KEY");
  });

  it("returns 400 for invalid request body", async () => {
    const response = await POST(jsonRequest({ agent, task }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid agent run request" });
    expect(runAgentTask).not.toHaveBeenCalled();
  });

  it("returns 500 for unknown runner errors", async () => {
    vi.mocked(runAgentTask).mockRejectedValue(new Error("database unavailable"));

    const response = await POST(jsonRequest({ agent, task, userRating: 5 }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Agent run failed" });
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

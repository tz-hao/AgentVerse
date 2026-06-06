import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import type { AgentProfile, AgentTask, AgentTaskResult } from "../lib/agents/agentTypes";
import { createPortfolioItem } from "../lib/agents/portfolio";

const agent: AgentProfile = {
  id: "agent_research_001",
  did: "agent://research-gpt-001",
  name: "ResearchGPT",
  category: "Research",
  description: "Research agent for AgentVerse.",
  skills: ["research"],
  serviceTypes: ["research-report"],
  ownerAddress: "0x123",
  collaborators: [],
};

const task: AgentTask = {
  id: "task_hyperliquid",
  title: "Analyze Hyperliquid",
  description: "Research Hyperliquid for AgentVerse.",
  category: "Research",
  input: "Analyze Hyperliquid.",
  rewardAmount: 25,
  status: "pending",
  createdAt: "2026-06-02T00:00:00.000Z",
};

const result: AgentTaskResult = {
  taskId: task.id,
  agentId: agent.id,
  summary: "Hyperliquid analysis completed.",
  output: "# Hyperliquid\n\nResearch report.",
  artifacts: ["Hyperliquid Research Report"],
  scoreSuggestion: 4,
  status: "success",
  executionMode: "deepseek",
  completedAt: "2026-06-02T01:00:00.000Z",
};

describe("createPortfolioItem", () => {
  it("creates an Agent GitHub portfolio item from task result", () => {
    const portfolioItem = createPortfolioItem(agent, task, result, 6);
    const expectedHash = `0x${createHash("sha256")
      .update(agent.id + task.id + result.summary + result.completedAt)
      .digest("hex")}`;

    expect(portfolioItem).toEqual({
      id: `portfolio_${expectedHash.slice(0, 16)}`,
      agentId: agent.id,
      taskId: task.id,
      title: task.title,
      summary: result.summary,
      content: result.output,
      artifacts: result.artifacts,
      rating: 5,
      evidenceHash: expectedHash,
      createdAt: result.completedAt,
    });
    expect(portfolioItem.evidenceHash.startsWith("0x")).toBe(true);
    expect(portfolioItem.evidenceHash).toHaveLength(66);
    expect(portfolioItem.evidenceHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("limits user rating to the 1 to 5 range", () => {
    expect(createPortfolioItem(agent, task, result, 0).rating).toBe(1);
    expect(createPortfolioItem(agent, task, result, 3).rating).toBe(3);
    expect(createPortfolioItem(agent, task, result, 9).rating).toBe(5);
  });
});

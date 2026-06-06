import { describe, expect, it } from "vitest";

import type { AgentProfile, AgentTask } from "../lib/agents/agentTypes";
import { createPortfolioItem } from "../lib/agents/portfolio";
import { buildReputationInput } from "../lib/agents/reputationInput";
import { runAgentTask } from "../lib/agents/taskRunner";

const agent: AgentProfile = {
  id: "agent_research_gpt_001",
  did: "agent://research-gpt-001",
  name: "ResearchGPT",
  category: "Research",
  description: "Research agent for AgentVerse.",
  skills: ["Token Research", "Onchain Analysis", "Risk Assessment"],
  serviceTypes: ["Web3 Research", "Protocol Analysis", "Risk Report"],
  ownerAddress: "0xResearchGPT",
  collaborators: ["AuditGPT", "RiskGPT", "MarketGPT"],
};

const task: AgentTask = {
  id: "task_analyze_hyperliquid",
  title: "Analyze Hyperliquid",
  description: "Research Hyperliquid from a Web3 project perspective.",
  category: "Research",
  input: "Hyperliquid",
  rewardAmount: 25,
  status: "pending",
  createdAt: "2026-06-02T00:00:00.000Z",
};

describe("AgentVerse Agent flow", () => {
  it("runs an agent task, creates a portfolio item, and builds reputation input", async () => {
    const result = await runAgentTask(agent, task);
    const portfolioItem = createPortfolioItem(agent, task, result, 5);
    const reputationInput = buildReputationInput(
      result,
      5,
      portfolioItem.evidenceHash,
    );

    expect(result).toMatchObject({
      agentId: agent.id,
      taskId: task.id,
      status: "success",
      executionMode: expect.stringMatching(/^(deepseek|fallback)$/),
    });
    expect(portfolioItem).toMatchObject({
      agentId: agent.id,
      taskId: task.id,
      title: task.title,
      summary: result.summary,
      content: result.output,
      artifacts: result.artifacts,
      rating: 5,
    });
    expect(portfolioItem.evidenceHash.startsWith("0x")).toBe(true);
    expect(portfolioItem.evidenceHash).toHaveLength(66);
    expect(portfolioItem.evidenceHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(reputationInput).toEqual({
      agentId: agent.id,
      taskId: task.id,
      success: true,
      userRating: 5,
      scoreDelta: result.scoreSuggestion + 5,
      evidence: result.summary,
      evidenceHash: portfolioItem.evidenceHash,
    });
  });

  it("returns a failed result for unsupported agent categories", async () => {
    const codingAgent: AgentProfile = {
      ...agent,
      id: "agent_coding_001",
      category: "Coding",
    };
    const codingTask: AgentTask = {
      ...task,
      id: "task_coding_001",
      category: "Coding",
    };

    const result = await runAgentTask(codingAgent, codingTask);

    expect(result).toMatchObject({
      agentId: codingAgent.id,
      taskId: codingTask.id,
      status: "failed",
      executionMode: "fallback",
      scoreSuggestion: 0,
    });
  });
});

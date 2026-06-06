import { describe, expect, it, vi } from "vitest";

import type { AgentProfile, AgentTask, AgentTaskResult } from "../lib/agents/agentTypes";
import { runDeepSeekResearchAgent } from "../lib/agents/deepseekResearchAgent";
import { runAgentTask } from "../lib/agents/taskRunner";

vi.mock("../lib/agents/deepseekResearchAgent", () => ({
  runDeepSeekResearchAgent: vi.fn(),
}));

const researchAgent: AgentProfile = {
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

const researchTask: AgentTask = {
  id: "task_001",
  title: "Analyze Hyperliquid",
  description: "Research task.",
  category: "Research",
  input: "Analyze Hyperliquid.",
  rewardAmount: 20,
  status: "pending",
  createdAt: "2026-06-02T00:00:00.000Z",
};

describe("runAgentTask", () => {
  it("dispatches Research agents to runDeepSeekResearchAgent", async () => {
    const expectedResult: AgentTaskResult = {
      taskId: researchTask.id,
      agentId: researchAgent.id,
      summary: "Research completed.",
      output: "# Research",
      artifacts: ["Research Report"],
      scoreSuggestion: 4,
      status: "success",
      executionMode: "deepseek",
      completedAt: "2026-06-02T01:00:00.000Z",
    };
    vi.mocked(runDeepSeekResearchAgent).mockResolvedValue(expectedResult);

    await expect(runAgentTask(researchAgent, researchTask)).resolves.toBe(expectedResult);
    expect(runDeepSeekResearchAgent).toHaveBeenCalledWith(researchAgent, researchTask);
  });

  it("returns a failed result for non-Research agents without calling DeepSeek", async () => {
    vi.mocked(runDeepSeekResearchAgent).mockClear();
    const codingAgent: AgentProfile = {
      ...researchAgent,
      id: "agent_coding_001",
      category: "Coding",
    };
    const codingTask: AgentTask = {
      ...researchTask,
      id: "task_coding_001",
      category: "Coding",
      title: "Build a smart contract",
    };

    const result = await runAgentTask(codingAgent, codingTask);

    expect(runDeepSeekResearchAgent).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      taskId: codingTask.id,
      agentId: codingAgent.id,
      summary: "Coding agent execution is not implemented yet.",
      output: "Agent category Coding is reserved for a future AgentVerse runner.",
      artifacts: [],
      scoreSuggestion: 0,
      status: "failed",
      executionMode: "fallback",
    });
    expect(result.completedAt).toEqual(expect.any(String));
  });
});

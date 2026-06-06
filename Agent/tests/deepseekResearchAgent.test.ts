import { afterEach, describe, expect, it, vi } from "vitest";

import type { AgentProfile, AgentTask } from "../lib/agents/agentTypes";
import { getDeepSeekClient } from "../lib/agents/deepseekClient";
import { runDeepSeekResearchAgent } from "../lib/agents/deepseekResearchAgent";

vi.mock("../lib/agents/deepseekClient", () => ({
  DEEPSEEK_MODEL: "deepseek-chat",
  getDeepSeekClient: vi.fn(),
}));

const agent: AgentProfile = {
  id: "agent_research_001",
  did: "agent://research-gpt-001",
  name: "ResearchGPT",
  category: "Research",
  description: "Research agent for market and protocol analysis.",
  skills: ["research", "market analysis"],
  serviceTypes: ["research-report"],
  ownerAddress: "0x123",
  collaborators: ["agent://audit-gpt-001"],
};

const task: AgentTask = {
  id: "task_001",
  title: "Analyze Hyperliquid",
  description: "Research Hyperliquid ecosystem and reputation signals.",
  category: "Research",
  input: "Analyze Hyperliquid and produce an AgentVerse-ready report.",
  rewardAmount: 25,
  status: "pending",
  createdAt: "2026-06-02T00:00:00.000Z",
};

describe("runDeepSeekResearchAgent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls DeepSeek chat completions with AgentVerse prompts and parses JSON", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Hyperliquid research completed as a portfolio-ready artifact.",
              output: [
                "# Research Artifact",
                "",
                "## Task Overview",
                "",
                "## Key Findings",
                "",
                "## Web3 Relevance",
                "",
                "## Risk Assessment",
                "",
                "## Final Recommendation",
                "",
                "## Portfolio Value",
                "This result can enter the Agent's professional portfolio.",
              ].join("\n"),
              artifacts: [
                "Hyperliquid Research Brief",
                "Risk Assessment Notes",
                "Onchain Research Summary",
              ],
              scoreSuggestion: 8,
            }),
          },
        },
      ],
    });
    vi.mocked(getDeepSeekClient).mockReturnValue({
      chat: { completions: { create } },
    } as unknown as ReturnType<typeof getDeepSeekClient>);

    const result = await runDeepSeekResearchAgent(agent, task);
    const request = create.mock.calls[0][0];
    const systemPrompt = request.messages[0].content;
    const userPrompt = request.messages[1].content;

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek-chat",
        response_format: { type: "json_object" },
      }),
    );
    expect(systemPrompt).toContain("AgentVerse = Agent LinkedIn + Agent GitHub + Agent Reputation Protocol");
    expect(systemPrompt).toContain("Research Agent");
    expect(systemPrompt).toContain("Agent Portfolio");
    expect(systemPrompt).toContain("Reputation Score");
    expect(systemPrompt).toContain("# Research Artifact");
    expect(systemPrompt).toContain("## Portfolio Value");
    expect(systemPrompt).toContain("Hyperliquid Research Brief");
    expect(userPrompt).toContain(agent.name);
    expect(userPrompt).toContain(task.title);
    expect(result).toMatchObject({
      taskId: task.id,
      agentId: agent.id,
      summary: "Hyperliquid research completed as a portfolio-ready artifact.",
      artifacts: [
        "Hyperliquid Research Brief",
        "Risk Assessment Notes",
        "Onchain Research Summary",
      ],
      scoreSuggestion: 5,
      status: "success",
      executionMode: "deepseek",
    });
    expect(result.output).toContain("# Research Artifact");
    expect(result.output).toContain("## Portfolio Value");
    expect(result.completedAt).toEqual(expect.any(String));
    expect(logSpy).toHaveBeenCalledWith("[AgentVerse] DeepSeek research agent completed");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns a fallback result when DeepSeek fails", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(getDeepSeekClient).mockImplementation(() => {
      throw new Error("missing key");
    });

    const result = await runDeepSeekResearchAgent(agent, task);

    expect(result.status).toBe("success");
    expect(result.summary).toContain("Fallback research result");
    expect(result.output).toContain("# Research Artifact");
    expect(result.output).toContain("## Task Overview");
    expect(result.output).toContain("## Key Findings");
    expect(result.output).toContain("## Web3 Relevance");
    expect(result.output).toContain("## Risk Assessment");
    expect(result.output).toContain("## Final Recommendation");
    expect(result.output).toContain("## Portfolio Value");
    expect(result.output).toContain("professional portfolio");
    expect(result.artifacts).toEqual([
      "Hyperliquid Research Brief",
      "Risk Assessment Notes",
      "Onchain Research Summary",
    ]);
    expect(result.scoreSuggestion).toBe(3);
    expect(result.executionMode).toBe("fallback");
    expect(warnSpy).toHaveBeenCalledWith("[AgentVerse] DeepSeek unavailable, using fallback");
    expect(logSpy).not.toHaveBeenCalled();
  });
});

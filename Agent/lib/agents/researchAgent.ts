import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";

export function createResearchAgent(agentName = "ResearchGPT"): AgentProfile {
  const normalizedName = agentName.trim() || "ResearchGPT";

  return {
    id: makeMockId("agent", normalizedName),
    did: `agent://${normalizedName.toLowerCase().replace(/\s+/g, "-")}`,
    name: normalizedName,
    category: "Research",
    description: "Mock Research Agent for AgentVerse portfolio and reputation demos.",
    skills: ["Token Research", "Onchain Analysis", "Risk Assessment"],
    serviceTypes: ["Web3 Research", "Protocol Analysis", "Risk Report"],
    ownerAddress: "0xResearchGPT",
    collaborators: ["AuditGPT", "RiskGPT", "MarketGPT"],
  };
}

export async function runResearchAgentTask(
  agent: AgentProfile,
  task: AgentTask,
): Promise<AgentTaskResult> {
  const topic = task.input.trim() || task.title;

  return {
    taskId: task.id,
    agentId: agent.id,
    summary: `${agent.name} completed a mock research report for ${topic}.`,
    output: [
      `# ${task.title}`,
      "",
      `Research topic: ${topic}`,
      "",
      "## AgentVerse Context",
      "This mock report can be published into the Agent GitHub Portfolio and used as evidence for Reputation Protocol input.",
    ].join("\n"),
    artifacts: [`${task.title} Research Report`],
    scoreSuggestion: 3,
    status: "success",
    executionMode: "fallback",
    completedAt: new Date().toISOString(),
  };
}

function makeMockId(prefix: string, value: string): string {
  return `${prefix}_${mockHash(value).slice(0, 12)}`;
}

function mockHash(value: string): string {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

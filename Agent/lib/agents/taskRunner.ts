import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runDeepSeekResearchAgent } from "./deepseekResearchAgent";

export async function runAgentTask(
  agent: AgentProfile,
  task: AgentTask,
): Promise<AgentTaskResult> {
  if (agent.category === "Research") {
    return runDeepSeekResearchAgent(agent, task);
  }

  // Future AgentVerse runners:
  // Coding / Audit / Trading / Marketing / CustomerService
  return {
    taskId: task.id,
    agentId: agent.id,
    summary: `${agent.category} agent execution is not implemented yet.`,
    output: `Agent category ${agent.category} is reserved for a future AgentVerse runner.`,
    artifacts: [],
    scoreSuggestion: 0,
    status: "failed",
    executionMode: "fallback",
    completedAt: new Date().toISOString(),
  };
}

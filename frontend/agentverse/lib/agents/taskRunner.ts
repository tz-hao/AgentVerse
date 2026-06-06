import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runAuditAgent } from "./auditAgent";
import { runCodingAgent } from "./codingAgent";
import { runCustomerServiceAgent } from "./customerServiceAgent";
import { runDeepSeekResearchAgent } from "./deepseekResearchAgent";
import { runMarketingAgent } from "./marketingAgent";
import { runTradingAgent } from "./tradingAgent";

export async function runAgentTask(
  agent: AgentProfile,
  task: AgentTask,
): Promise<AgentTaskResult> {
  switch (agent.category) {
    case "Research":
      return runDeepSeekResearchAgent(agent, task);
    case "Audit":
      return runAuditAgent(agent, task);
    case "Coding":
      return runCodingAgent(agent, task);
    case "Marketing":
      return runMarketingAgent(agent, task);
    case "CustomerService":
      return runCustomerServiceAgent(agent, task);
    case "Trading":
      return runTradingAgent(agent, task);
  }

  return {
    taskId: task.id,
    agentId: agent.id,
    summary: `${agent.category} agent generated a fallback AgentVerse artifact.`,
    output: [
      `# ${agent.category} Artifact`,
      "",
      `## Task Overview`,
      `${agent.name} received task "${task.title}".`,
      "",
      `## Result`,
      `This fallback result keeps the AgentVerse MVP flow available for category ${agent.category}.`,
      "",
      `## Portfolio Value`,
      "The result can be stored as a demo-safe Agent GitHub artifact and rated before reputation recording.",
    ].join("\n"),
    artifacts: [`${task.input} ${agent.category} Artifact`],
    scoreSuggestion: 3,
    status: "success",
    executionMode: "fallback",
    completedAt: new Date().toISOString(),
  };
}

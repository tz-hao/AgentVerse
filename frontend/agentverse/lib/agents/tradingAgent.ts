import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runProfessionalAgent } from "./professionalAgentRunner";

export function runTradingAgent(agent: AgentProfile, task: AgentTask): Promise<AgentTaskResult> {
  return runProfessionalAgent(agent, task, {
    role: "Web3 Trading Analysis Agent",
    objective: "Provide scenario-based market analysis and risk controls without presenting financial advice.",
    reportTitle: "Trading Analysis Artifact",
    sections: ["Market Context", "Trading Scenarios", "Risk Controls", "Invalidation Conditions", "Portfolio Value"],
    artifactNames: ["Market Scenario Brief", "Risk Control Notes", "Trading Invalidation Checklist"],
    fallbackSummary: "Generated a fallback trading analysis artifact with scenarios and risk controls.",
  });
}

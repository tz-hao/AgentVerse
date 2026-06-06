import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runProfessionalAgent } from "./professionalAgentRunner";

export function runAuditAgent(agent: AgentProfile, task: AgentTask): Promise<AgentTaskResult> {
  return runProfessionalAgent(agent, task, {
    role: "Web3 Audit Agent",
    objective: "Identify security risks, suspicious assumptions, attack surfaces, and remediation priorities.",
    reportTitle: "Audit Artifact",
    sections: ["Audit Scope", "Key Findings", "Risk Severity", "Recommended Fixes", "Portfolio Value"],
    artifactNames: ["Audit Findings Report", "Risk Severity Matrix", "Remediation Checklist"],
    fallbackSummary: "Generated a fallback security audit artifact with risk findings and remediation guidance.",
  });
}

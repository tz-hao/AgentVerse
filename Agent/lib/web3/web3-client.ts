import { Contract } from "ethers";
import type { Provider, Signer } from "ethers";

import type { ReputationInput } from "@/lib/agents/agentTypes";

export const AGENTVERSE_CHAIN = process.env.NEXT_PUBLIC_CHAIN || "sepolia";

const DEFAULT_AGENT_REGISTRY_ADDRESS = "0xB7876481BF930fCDE01eae47896F8f49dF4B7351";
const DEFAULT_REPUTATION_PROTOCOL_ADDRESS = "0x8c3e3d4C54CB8009798ebd04ad0811F25f05b2d7";

export const AGENT_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || DEFAULT_AGENT_REGISTRY_ADDRESS;

export const REPUTATION_PROTOCOL_ADDRESS =
  process.env.NEXT_PUBLIC_REPUTATION_PROTOCOL_ADDRESS || DEFAULT_REPUTATION_PROTOCOL_ADDRESS;

export function getAgentRegistryAddress(): string {
  return AGENT_REGISTRY_ADDRESS;
}

export function getReputationProtocolAddress(): string {
  return REPUTATION_PROTOCOL_ADDRESS;
}

const REPUTATION_PROTOCOL_ABI = [
  "function recordTask(string,string,bool,uint8,int256,string) external",
  "function getReputation(string) view returns (string,int256,uint256,uint256,uint256,uint256)",
] as const;

export type OnChainReputation = {
  agentId: string;
  score: bigint;
  completedTasks: bigint;
  successfulTasks: bigint;
  averageRating: bigint;
  updatedAt: bigint;
};

export type TaskRecordReceipt = {
  txHash: string;
  blockNumber: number | null;
};

export async function recordTaskOnChain(
  signer: Signer,
  contractAddress: string,
  input: ReputationInput,
): Promise<TaskRecordReceipt> {
  assertEvidenceHash(input.evidenceHash);

  const protocol = new Contract(contractAddress, REPUTATION_PROTOCOL_ABI, signer);
  const tx = await protocol.recordTask(
    input.agentId,
    input.taskId,
    input.success,
    input.userRating,
    input.scoreDelta,
    input.evidenceHash,
  );

  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
  };
}

export async function getReputation(
  provider: Provider,
  contractAddress: string,
  agentId: string,
): Promise<OnChainReputation> {
  const protocol = new Contract(contractAddress, REPUTATION_PROTOCOL_ABI, provider);
  const [id, score, completedTasks, successfulTasks, averageRating, updatedAt] =
    await protocol.getReputation(agentId);

  return {
    agentId: id,
    score: BigInt(score),
    completedTasks: BigInt(completedTasks),
    successfulTasks: BigInt(successfulTasks),
    averageRating: BigInt(averageRating),
    updatedAt: BigInt(updatedAt),
  };
}

function assertEvidenceHash(evidenceHash: string): void {
  if (!/^0x[a-f0-9]{64}$/.test(evidenceHash)) {
    throw new Error("evidenceHash must match 0x + 64 lowercase hex characters.");
  }
}

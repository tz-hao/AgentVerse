import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const REPUTATION_ADDR = "0x8c3e3d4C54CB8009798ebd04ad0811F25f05b2d7";

  const protocol = await ethers.getContractAt("ReputationProtocol", REPUTATION_ADDR, signer);

  console.log("Calling recordTask()...");
  console.log(`  agentId:      research-gpt-001`);
  console.log(`  taskId:       task-analyze-hyperliquid`);
  console.log(`  success:      true`);
  console.log(`  userRating:   5`);
  console.log(`  scoreDelta:   9`);
  console.log(`  evidenceHash: 0x${"ab".repeat(32)}`);

  const tx = await protocol.recordTask(
    "research-gpt-001",
    "task-analyze-hyperliquid",
    true,
    5,
    9,
    "0x" + "ab".repeat(32)
  );
  console.log(`\n  txHash: ${tx.hash}`);
  console.log(`  Waiting for confirmation...`);

  const receipt = await tx.wait();
  console.log(`  Block:   ${receipt!.blockNumber}`);
  console.log(`  Gas used: ${receipt!.gasUsed.toString()}`);

  // Read back reputation
  const [, score, completed, successful, avgRating] = await protocol.getReputation("research-gpt-001");
  console.log(`\n  Reputation on-chain:`);
  console.log(`    score:           ${score}`);
  console.log(`    completedTasks:  ${completed}`);
  console.log(`    successfulTasks: ${successful}`);
  console.log(`    averageRating:   ${avgRating}`);
}

main().catch(console.error);

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ── 1. Deploy AgentRegistry ─────────────────────────────────────────────
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();

  const registryAddr = await agentRegistry.getAddress();
  console.log(`✅ AgentRegistry deployed to: ${registryAddr}`);

  // ── 2. Deploy ReputationProtocol ────────────────────────────────────────
  const ReputationProtocol = await ethers.getContractFactory("ReputationProtocol");
  const reputationProtocol = await ReputationProtocol.deploy(registryAddr);
  await reputationProtocol.waitForDeployment();

  const protocolAddr = await reputationProtocol.getAddress();
  console.log(`✅ ReputationProtocol deployed to: ${protocolAddr}\n`);

  // ── 3. Summary ──────────────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deploy Summary — Ethereum Sepolia");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  AgentRegistry:       ${registryAddr}`);
  console.log(`  ReputationProtocol:  ${protocolAddr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("Next steps:");
  console.log("  npx hardhat verify --network sepolia " + registryAddr);
  console.log("  npx hardhat verify --network sepolia " + protocolAddr + " " + registryAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

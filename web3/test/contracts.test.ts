import { expect } from "chai";
import { ethers } from "hardhat";
import type { AgentRegistry, ReputationProtocol } from "../typechain-types";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("AgentRegistry");
    registry = (await Factory.deploy()) as unknown as AgentRegistry;
    await registry.waitForDeployment();
  });

  it("registers a new agent", async function () {
    const tx = await registry.registerAgent("agent-001", "did:example:123", "TestAgent", "research");
    const receipt = await tx.wait();

    // Check event
    await expect(tx)
      .to.emit(registry, "AgentRegistered")
      .withArgs("agent-001", "did:example:123", "TestAgent", "research", await (await ethers.getSigners())[0].getAddress(), /* any timestamp */ (t: unknown) => true);

    // Check getAgent
    const [id, did, name, category, owner, exists] = await registry.getAgent("agent-001");
    expect(id).to.equal("agent-001");
    expect(did).to.equal("did:example:123");
    expect(name).to.equal("TestAgent");
    expect(category).to.equal("research");
    expect(exists).to.be.true;
  });

  it("rejects duplicate agentId", async function () {
    await registry.registerAgent("agent-001", "did:example:123", "TestAgent", "research");
    await expect(
      registry.registerAgent("agent-001", "did:example:456", "AnotherAgent", "defi")
    ).to.be.revertedWithCustomError(registry, "AgentAlreadyExists");
  });

  it("rejects empty agentId", async function () {
    await expect(
      registry.registerAgent("", "did:example:123", "TestAgent", "research")
    ).to.be.revertedWithCustomError(registry, "EmptyAgentId");
  });

  it("returns correct agent count and enumeration", async function () {
    await registry.registerAgent("agent-001", "did:a:1", "Agent1", "research");
    await registry.registerAgent("agent-002", "did:a:2", "Agent2", "defi");

    expect(await registry.agentCount()).to.equal(2n);
    expect(await registry.agentAtIndex(0)).to.equal("agent-001");
    expect(await registry.agentAtIndex(1)).to.equal("agent-002");
  });
});

describe("ReputationProtocol", function () {
  let registry: AgentRegistry;
  let protocol: ReputationProtocol;

  beforeEach(async function () {
    const RegFactory = await ethers.getContractFactory("AgentRegistry");
    registry = (await RegFactory.deploy()) as unknown as AgentRegistry;
    await registry.waitForDeployment();

    const ProtoFactory = await ethers.getContractFactory("ReputationProtocol");
    protocol = (await ProtoFactory.deploy(await registry.getAddress())) as unknown as ReputationProtocol;
    await protocol.waitForDeployment();
  });

  const VALID_HASH = "0x" + "a".repeat(64);

  it("records a task and updates reputation", async function () {
    const tx = await protocol.recordTask(
      "agent-001",
      "task-001",
      true,
      5,
      10n,
      VALID_HASH
    );
    const receipt = await tx.wait();

    // Check TaskRecorded event
    await expect(tx)
      .to.emit(protocol, "TaskRecorded")
      .withArgs("agent-001", "task-001", true, 5, 10n, "0x" + "a".repeat(64), /* any timestamp */ (t: unknown) => true);

    // Check ReputationUpdated event
    await expect(tx)
      .to.emit(protocol, "ReputationUpdated")
      .withArgs("agent-001", 10n, 1n, 1n, /* any timestamp */ (t: unknown) => true);

    // Check getReputation
    const [id, score, completed, successful, avgRating] = await protocol.getReputation("agent-001");
    expect(id).to.equal("agent-001");
    expect(score).to.equal(10n);
    expect(completed).to.equal(1n);
    expect(successful).to.equal(1n);
    expect(avgRating).to.equal(5n);

    // Check getTaskRecord
    const [aId, tId, success, rating, delta, hash] = await protocol.getTaskRecord("agent-001", "task-001");
    expect(aId).to.equal("agent-001");
    expect(tId).to.equal("task-001");
    expect(success).to.be.true;
    expect(rating).to.equal(5);
    expect(delta).to.equal(10n);
    expect(hash).to.equal("0x" + "a".repeat(64));
  });

  it("rejects invalid rating", async function () {
    await expect(
      protocol.recordTask("agent-001", "task-001", true, 0, 10n, VALID_HASH)
    ).to.be.revertedWithCustomError(protocol, "InvalidRating");

    await expect(
      protocol.recordTask("agent-001", "task-001", true, 6, 10n, VALID_HASH)
    ).to.be.revertedWithCustomError(protocol, "InvalidRating");
  });

  it("rejects duplicate task", async function () {
    await protocol.recordTask("agent-001", "task-001", true, 5, 10n, VALID_HASH);
    await expect(
      protocol.recordTask("agent-001", "task-001", true, 4, 5n, VALID_HASH)
    ).to.be.revertedWithCustomError(protocol, "TaskAlreadyRecorded");
  });

  it("accumulates reputation across multiple tasks", async function () {
    await protocol.recordTask("agent-001", "task-001", true, 5, 10n, VALID_HASH);
    await protocol.recordTask("agent-001", "task-002", false, 2, -5n, VALID_HASH);

    const [, score, completed, successful, avgRating] = await protocol.getReputation("agent-001");
    expect(score).to.equal(5n); // 10 + (-5)
    expect(completed).to.equal(2n);
    expect(successful).to.equal(1n);
    expect(avgRating).to.equal(3n); // (5 + 2) / 2
  });

  it("rejects invalid evidenceHash format", async function () {
    await expect(
      protocol.recordTask("agent-001", "task-001", true, 5, 10n, "0xdead")
    ).to.be.reverted; // evidenceHash must be 66 chars
  });

  it("handles large userRating (5) correctly", async function () {
    await protocol.recordTask("agent-001", "task-001", true, 5, 100n, VALID_HASH);
    const [, , , , avgRating] = await protocol.getReputation("agent-001");
    expect(avgRating).to.equal(5n);
  });
});

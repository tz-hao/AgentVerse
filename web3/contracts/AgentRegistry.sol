// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentRegistry
/// @notice On-chain registry for AgentVerse AI agent identities.
/// @dev Minimal V1 — no upgrade, no governance, no fees.
contract AgentRegistry {
    // ── Types ──────────────────────────────────────────────────────────────

    struct Agent {
        string agentId;
        string did;
        string name;
        string category;
        address owner;
        bool exists;
    }

    // ── State ──────────────────────────────────────────────────────────────

    /// @notice agentId → Agent
    mapping(string => Agent) private agents;

    /// @notice owner address → list of agentIds they own
    mapping(address => string[]) private ownedAgents;

    /// @notice Track registered agentIds for enumeration
    string[] private agentIndex;

    // ── Events ─────────────────────────────────────────────────────────────

    event AgentRegistered(
        string indexed agentId,
        string did,
        string name,
        string category,
        address indexed owner,
        uint256 timestamp
    );

    error AgentAlreadyExists(string agentId);
    error AgentNotFound(string agentId);
    error EmptyAgentId();

    // ── Write ──────────────────────────────────────────────────────────────

    /// @notice Register a new agent identity.
    /// @param agentId Unique off-chain agent identifier (e.g. "research-gpt-001")
    /// @param did    Decentralized identifier string
    /// @param name   Human-readable agent name
    /// @param category Category label (e.g. "research", "defi", "nft")
    function registerAgent(
        string memory agentId,
        string memory did,
        string memory name,
        string memory category
    ) external {
        if (bytes(agentId).length == 0) revert EmptyAgentId();
        if (agents[agentId].exists) revert AgentAlreadyExists(agentId);

        agents[agentId] = Agent({
            agentId: agentId,
            did: did,
            name: name,
            category: category,
            owner: msg.sender,
            exists: true
        });

        ownedAgents[msg.sender].push(agentId);
        agentIndex.push(agentId);

        emit AgentRegistered(agentId, did, name, category, msg.sender, block.timestamp);
    }

    // ── Read ───────────────────────────────────────────────────────────────

    /// @notice Get full agent details by agentId.
    function getAgent(
        string memory agentId
    )
        external
        view
        returns (
            string memory _agentId,
            string memory did,
            string memory name,
            string memory category,
            address owner,
            bool exists
        )
    {
        Agent storage agent = agents[agentId];
        return (
            agent.agentId,
            agent.did,
            agent.name,
            agent.category,
            agent.owner,
            agent.exists
        );
    }

    /// @notice Get all agentIds owned by an address.
    function getAgentsByOwner(address owner) external view returns (string[] memory) {
        return ownedAgents[owner];
    }

    /// @notice Total number of registered agents.
    function agentCount() external view returns (uint256) {
        return agentIndex.length;
    }

    /// @notice Get agentId at a given index (for enumeration).
    function agentAtIndex(uint256 index) external view returns (string memory) {
        require(index < agentIndex.length, "Index out of bounds");
        return agentIndex[index];
    }
}

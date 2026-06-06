// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IAgentRegistry
/// @notice Interface for the AgentRegistry contract.
interface IAgentRegistry {
    struct Agent {
        string agentId;
        string did;
        string name;
        string category;
        address owner;
        bool exists;
    }

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

    function registerAgent(
        string calldata agentId,
        string calldata did,
        string calldata name,
        string calldata category
    ) external;

    function getAgent(
        string calldata agentId
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
        );

    function getAgentsByOwner(address owner) external view returns (string[] memory);

    function agentCount() external view returns (uint256);

    function agentAtIndex(uint256 index) external view returns (string memory);
}


/// @title IReputationProtocol
/// @notice Interface for the ReputationProtocol contract.
interface IReputationProtocol {
    struct TaskRecord {
        string agentId;
        string taskId;
        bool success;
        uint8 userRating;
        int256 scoreDelta;
        bytes32 evidenceHash;
        uint256 timestamp;
    }

    struct Reputation {
        string agentId;
        int256 score;
        uint256 completedTasks;
        uint256 successfulTasks;
        uint256 totalRatingScore;
        uint256 ratingCount;
        uint256 updatedAt;
    }

    event TaskRecorded(
        string indexed agentId,
        string indexed taskId,
        bool success,
        uint8 userRating,
        int256 scoreDelta,
        bytes32 indexed evidenceHash,
        uint256 timestamp
    );

    event ReputationUpdated(
        string indexed agentId,
        int256 score,
        uint256 completedTasks,
        uint256 successfulTasks,
        uint256 timestamp
    );

    error InvalidRating(uint8 rating);
    error TaskAlreadyRecorded(string agentId, string taskId);
    error AgentNotRegistered(string agentId);
    error EmptyAgentId();
    error EmptyTaskId();
    error InvalidAgentRegistry();

    function recordTask(
        string calldata agentId,
        string calldata taskId,
        bool success,
        uint8 userRating,
        int256 scoreDelta,
        string calldata evidenceHash
    ) external;

    function getReputation(
        string calldata agentId
    )
        external
        view
        returns (
            string memory _agentId,
            int256 score,
            uint256 completedTasks,
            uint256 successfulTasks,
            uint256 averageRating,
            uint256 updatedAt
        );

    function getTaskRecord(
        string calldata agentId,
        string calldata taskId
    )
        external
        view
        returns (
            string memory _agentId,
            string memory _taskId,
            bool success,
            uint8 userRating,
            int256 scoreDelta,
            bytes32 evidenceHash,
            uint256 timestamp
        );

    function taskCount() external view returns (uint256);

    function taskAtIndex(uint256 index) external view returns (bytes32);

    function agentRegistry() external view returns (address);
}

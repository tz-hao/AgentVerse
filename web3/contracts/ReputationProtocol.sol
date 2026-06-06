// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ReputationProtocol
/// @notice On-chain task-record & reputation-score ledger for AgentVerse agents.
/// @dev Minimal V1 — stores evidenceHash, not full evidence text. No staking / slashing.
contract ReputationProtocol {
    // ── Types ──────────────────────────────────────────────────────────────

    struct TaskRecord {
        string agentId;
        string taskId;
        bool success;
        uint8 userRating;   // 1–5
        int256 scoreDelta;
        bytes32 evidenceHash;
        uint256 timestamp;
    }

    struct Reputation {
        string agentId;
        int256 score;
        uint256 completedTasks;
        uint256 successfulTasks;
        uint256 totalRatingScore; // sum of userRating for averaging
        uint256 ratingCount;
        uint256 updatedAt;
    }

    // ── State ──────────────────────────────────────────────────────────────

    /// @notice agentId → Reputation
    mapping(string => Reputation) private reputations;

    /// @notice keccak256(abi.encodePacked(agentId, taskId)) → TaskRecord
    mapping(bytes32 => TaskRecord) private taskRecords;

    /// @notice AgentRegistry contract for existence checks
    address public agentRegistry;

    /// @notice Track all recorded task keys for enumeration
    bytes32[] private taskIndex;

    // ── Events ─────────────────────────────────────────────────────────────

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

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(address _agentRegistry) {
        if (_agentRegistry == address(0)) revert InvalidAgentRegistry();
        agentRegistry = _agentRegistry;
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /// @dev Deterministic key from agentId + taskId.
    function _taskKey(
        string memory agentId,
        string memory taskId
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(agentId, taskId));
    }

    /// @dev Convert "0x…" hex string evidenceHash to bytes32.
    ///      Expects a 66-character hex string ("0x" + 64 hex chars).
    function _parseEvidenceHash(
        string memory hexStr
    ) private pure returns (bytes32) {
        bytes memory b = bytes(hexStr);
        require(b.length == 66, "evidenceHash must be 66 chars (0x + 64 hex)");

        bytes32 result;
        for (uint256 i = 0; i < 32; i++) {
            uint8 hi = uint8(b[2 + i * 2]);
            uint8 lo = uint8(b[3 + i * 2]);

            if (hi >= 48 && hi <= 57) hi -= 48;
            else if (hi >= 65 && hi <= 70) hi -= 55;
            else if (hi >= 97 && hi <= 102) hi -= 87;
            else revert("Invalid hex character");

            if (lo >= 48 && lo <= 57) lo -= 48;
            else if (lo >= 65 && lo <= 70) lo -= 55;
            else if (lo >= 97 && lo <= 102) lo -= 87;
            else revert("Invalid hex character");

            result |= bytes32(uint256(hi) << 4 | uint256(lo)) << ((31 - i) * 8);
        }
        return result;
    }

    // ── Write ──────────────────────────────────────────────────────────────

    /// @notice Record a completed task and update agent reputation.
    /// @param agentId      Agent identifier (must be registered in AgentRegistry)
    /// @param taskId       Task identifier (e.g. "task-analyze-hyperliquid")
    /// @param success      Whether the task was successful
    /// @param userRating   User rating 1–5
    /// @param scoreDelta   Score change (positive or negative)
    /// @param evidenceHash Hex string "0x…" — hash linking to off-chain evidence
    function recordTask(
        string memory agentId,
        string memory taskId,
        bool success,
        uint8 userRating,
        int256 scoreDelta,
        string memory evidenceHash
    ) external {
        // ── Guards ──────────────────────────────────────────────────────
        if (bytes(agentId).length == 0) revert EmptyAgentId();
        if (bytes(taskId).length == 0) revert EmptyTaskId();
        if (userRating < 1 || userRating > 5) revert InvalidRating(userRating);

        bytes32 key = _taskKey(agentId, taskId);
        if (taskRecords[key].timestamp != 0) {
            revert TaskAlreadyRecorded(agentId, taskId);
        }

        bytes32 evidenceHashBytes = _parseEvidenceHash(evidenceHash);

        // ── Store task record ───────────────────────────────────────────
        taskRecords[key] = TaskRecord({
            agentId: agentId,
            taskId: taskId,
            success: success,
            userRating: userRating,
            scoreDelta: scoreDelta,
            evidenceHash: evidenceHashBytes,
            timestamp: block.timestamp
        });
        taskIndex.push(key);

        emit TaskRecorded(
            agentId, taskId, success, userRating, scoreDelta,
            evidenceHashBytes, block.timestamp
        );

        // ── Update reputation ───────────────────────────────────────────
        Reputation storage rep = reputations[agentId];
        if (bytes(rep.agentId).length == 0) {
            // First-time reputation initialization
            rep.agentId = agentId;
        }

        rep.score += scoreDelta;
        rep.completedTasks += 1;
        if (success) {
            rep.successfulTasks += 1;
        }
        rep.totalRatingScore += userRating;
        rep.ratingCount += 1;
        rep.updatedAt = block.timestamp;

        emit ReputationUpdated(
            agentId, rep.score, rep.completedTasks,
            rep.successfulTasks, block.timestamp
        );
    }

    // ── Read ───────────────────────────────────────────────────────────────

    /// @notice Get the full reputation snapshot for an agent.
    function getReputation(
        string memory agentId
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
        )
    {
        Reputation storage rep = reputations[agentId];
        uint256 avg = rep.ratingCount > 0
            ? rep.totalRatingScore / rep.ratingCount
            : 0;

        return (
            rep.agentId,
            rep.score,
            rep.completedTasks,
            rep.successfulTasks,
            avg,
            rep.updatedAt
        );
    }

    /// @notice Get a specific task record by agentId + taskId.
    function getTaskRecord(
        string memory agentId,
        string memory taskId
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
        )
    {
        bytes32 key = _taskKey(agentId, taskId);
        TaskRecord storage record = taskRecords[key];
        require(record.timestamp != 0, "Task record not found");

        return (
            record.agentId,
            record.taskId,
            record.success,
            record.userRating,
            record.scoreDelta,
            record.evidenceHash,
            record.timestamp
        );
    }

    /// @notice Total number of task records ever recorded.
    function taskCount() external view returns (uint256) {
        return taskIndex.length;
    }

    /// @notice Get task key at a given index (for enumeration).
    function taskAtIndex(uint256 index) external view returns (bytes32) {
        require(index < taskIndex.length, "Index out of bounds");
        return taskIndex[index];
    }
}

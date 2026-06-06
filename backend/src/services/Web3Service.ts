import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/your-api-key';
const REPUTATION_CONTRACT_ADDRESS = process.env.REPUTATION_CONTRACT_ADDRESS || '0x8c3e3d4C54CB8009798ebd04ad0811F25f05b2d7';

const REPUTATION_ABI = [
  "function getReputation(string agentId) public view returns (uint256 score, uint256 completedTasks, uint256 successfulTasks, uint256 averageRating)",
  "function getTaskRecord(string agentId, string taskId) public view returns (bool success, uint256 userRating, uint256 scoreDelta, string evidenceHash, uint256 timestamp)"
];

export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(REPUTATION_CONTRACT_ADDRESS, REPUTATION_ABI, this.provider);
  }

  async getReputation(agentId: string) {
    try {
      const result = await this.contract.getReputation(agentId);
      return {
        score: Number(result.score),
        completedTasks: Number(result.completedTasks),
        successfulTasks: Number(result.successfulTasks),
        averageRating: Number(result.averageRating)
      };
    } catch (error) {
      console.error('Error reading reputation from chain:', error);
      return { score: 0, completedTasks: 0, successfulTasks: 0, averageRating: 0 };
    }
  }

  async getTaskRecord(agentId: string, taskId: string) {
    try {
      const result = await this.contract.getTaskRecord(agentId, taskId);
      return {
        success: result.success,
        userRating: Number(result.userRating),
        scoreDelta: Number(result.scoreDelta),
        evidenceHash: result.evidenceHash,
        timestamp: new Date(Number(result.timestamp) * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error reading task record from chain:', error);
      return {
        success: false,
        userRating: 0,
        scoreDelta: 0,
        evidenceHash: '',
        timestamp: new Date(0).toISOString()
      };
    }
  }
}

export const web3Service = new Web3Service();

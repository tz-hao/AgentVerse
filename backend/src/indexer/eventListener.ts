import * as dotenv from 'dotenv';
import { ensureDataSource } from '../database';
import { eventHandler, ContractEvent } from '../services/EventHandlerService';

dotenv.config();

const PORTALDOT_CHAIN = process.env.CHAIN_ENDPOINT || 'wss://testnet.portaldot.io';
const SBT_CONTRACT_ADDRESS = process.env.SBT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const RELATIONSHIP_CONTRACT_ADDRESS = process.env.RELATIONSHIP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000001';
const POLL_INTERVAL_MS = Number(process.env.INDEXER_POLL_INTERVAL_MS || '15000');

class SbtNodeProcessor {
  async initialize(): Promise<void> {
    await ensureDataSource();
    console.log('[Indexer] SovereignGraph event listener initialized');
    console.log(`[Indexer] Chain: ${PORTALDOT_CHAIN}`);
    console.log(`[Indexer] SBT Contract: ${SBT_CONTRACT_ADDRESS}`);
    console.log(`[Indexer] Relationship Contract: ${RELATIONSHIP_CONTRACT_ADDRESS}`);
  }

  async processEvent(event: ContractEvent): Promise<void> {
    await eventHandler.processEvent(event);
  }

  async start(): Promise<void> {
    console.log('[Indexer] Starting lightweight listener loop...');
    console.log('[Indexer] Connect your real chain event source and feed normalized events into processEvent().');

    setInterval(() => {
      console.log('[Indexer] Poll heartbeat: waiting for contract events...');
    }, POLL_INTERVAL_MS);
  }
}

const indexer = new SbtNodeProcessor();

indexer.initialize()
  .then(() => indexer.start())
  .catch((err) => {
    console.error('[Indexer] Fatal error:', err);
    process.exit(1);
  });

export { indexer, SbtNodeProcessor };

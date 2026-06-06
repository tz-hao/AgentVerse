import 'reflect-metadata';
import { ensureDataSource } from './database';
import { startGraphqlServer } from './graphql/server';
import { graphService } from './services/GraphService';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('===========================================');
  console.log('  AgentVerse Backend');
  console.log('  AI Agent Identity & Reputation Network');
  console.log('===========================================\n');

  try {
    await ensureDataSource();
    console.log('[Init] Database connection established\n');

    console.log('[Services] Available endpoints:');
    console.log('  - GraphQL API: http://localhost:4000/graphql');
    console.log('  - Event Listener: Listening for contract events');
    console.log('');

    console.log('[AgentVerse API] Query examples:');
    console.log('  # Register new Agent');
    console.log('  mutation { registerAgent(agentId: "research-gpt-001", ...) { agentId, tier } }');
    console.log('');
    console.log('  # Get Agent profile with reputation');
    console.log('  query { agent(agentId: "research-gpt-001") { displayName, tier, reputation { score } } }');
    console.log('');
    console.log('  # Search Agents by category');
    console.log('  query { agents(category: RESEARCH) { agentId, displayName, skills } }');
    console.log('');
    console.log('  # Create project and complete it');
    console.log('  mutation { createProject(agentId: "research-gpt-001", projectName: "Hyperliquid Research") { id } }');
    console.log('  mutation { completeProject(id: "proj_xxx", outputResult: "...") { status, rating } }');
    console.log('');

    const stats = await graphService.buildKnowledgeGraph();
    console.log(`[Graph] Current graph state:`);
    console.log(`  - Nodes: ${stats.nodes.length}`);
    console.log(`  - Edges: ${stats.edges.length}`);
    console.log(`  - RDF Triples: ${stats.triples.length}`);
    console.log('');

    await startGraphqlServer();
    console.log('[Ready] AgentVerse Backend is running...');
  } catch (error) {
    console.error('[Fatal] Failed to initialize backend services:', error);
    process.exit(1);
  }
}

main();

import 'reflect-metadata';
import { createServer, type Server } from 'http';
import { buildSchema, graphql, GraphQLFieldResolver } from 'graphql';
import { typeDefs } from './schema';
import { agentTypeDefs } from './agentSchema';
import { resolvers } from './resolvers';
import { agentResolvers } from './agentResolvers';
import { ensureDataSource } from '../database';
import { seedDiscoveryDemoDataIfEmpty } from '../services/DiscoverySeedService';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.GRAPHQL_PORT || '4000');
let activeServer: Server | null = null;

const combinedTypeDefs = [typeDefs, agentTypeDefs];
const combinedResolvers = { ...resolvers, ...agentResolvers };

function getOperationRoot(info: { parentType: { name: string } }): string {
  if (info.parentType.name === 'Query') {
    return 'query';
  }

  if (info.parentType.name === 'Mutation') {
    return 'mutation';
  }

  return 'nested';
}

const fieldResolver: GraphQLFieldResolver<unknown, unknown> = async (source, args, _context, info) => {
  const operationRoot = getOperationRoot(info);

  if (operationRoot === 'query' || operationRoot === 'mutation') {
    const fn = (combinedResolvers as Record<string, unknown>)[info.fieldName];
    if (typeof fn === 'function') {
      return (fn as (input: Record<string, unknown>) => unknown)(args as Record<string, unknown>);
    }
  }

  if (source && typeof source === 'object') {
    const sourceRecord = source as Record<string, unknown>;
    const directValue = sourceRecord[info.fieldName];
    if (directValue !== undefined) {
      return directValue;
    }
  }

  const nestedResolver = (combinedResolvers as Record<string, unknown>)[info.fieldName];
  if (typeof nestedResolver === 'function') {
    return (nestedResolver as (parent: unknown, input: Record<string, unknown>) => unknown)(
      source,
      args as Record<string, unknown>
    );
  }

  return undefined;
}

export async function startGraphqlServer(): Promise<void> {
  await ensureDataSource();
  await seedDiscoveryDemoDataIfEmpty();

  const schema = buildSchema(combinedTypeDefs.join('\n'), { assumeValidSDL: true });
  const server = createServer(async (req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === 'GET' && req.url === '/graphql') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <head>
            <title>AgentVerse GraphQL API</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
              .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
              h1 { color: #1a73e8; margin-bottom: 1rem; }
              p { color: #5f6368; line-height: 1.5; }
              .status { display: inline-block; padding: 0.25rem 0.75rem; background: #e6f4ea; color: #137333; border-radius: 16px; font-size: 0.875rem; font-weight: bold; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>AgentVerse API</h1>
              <p>GraphQL 接口已成功运行。这是一个 <strong>POST</strong> 端点，请使用 GraphQL 客户端（如 Postman、Insomnia 或 Apollo Sandbox）进行调用。</p>
              <div class="status">● 运行中</div>
            </div>
          </body>
        </html>
      `);
      return;
    }

    if (req.method !== 'POST' || req.url !== '/graphql') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = body ? (JSON.parse(body) as { query?: string; variables?: Record<string, unknown> }) : {};
        if (!payload.query) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing GraphQL query' }));
          return;
        }

        const result = await graphql({
          schema,
          source: payload.query,
          variableValues: payload.variables,
          fieldResolver,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
      }
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => resolve());
  });

  activeServer = server;
  console.log(`[GraphQL Server] SovereignGraph API ready at http://localhost:${PORT}/graphql`);
}

if (require.main === module) {
  startGraphqlServer().catch((err) => {
    console.error('[GraphQL Server] Failed to start:', err);
    process.exit(1);
  });
}

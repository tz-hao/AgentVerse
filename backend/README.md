# SovereignGraph Backend

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Portaldot Network                         │
│                   (ink! Smart Contracts)                        │
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────────────┐   │
│  │   SBT Contract  │              │  Relationship Contract  │   │
│  │                 │              │                          │   │
│  │ - SBTMinted     │              │ - RelationshipCreated   │   │
│  │ - SBTMetadata   │              │ - RelationshipRevoked  │   │
│  └────────┬────────┘              └────────────┬────────────┘   │
└───────────┼───────────────────────────────────┼─────────────────┘
            │                                   │
            └────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Event Listener │
                    │   (Subsquid)     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼─────┐ ┌──────▼──────┐ ┌─────▼─────┐
     │  SbtNode     │ │ Relationship│ │   RDF     │
     │  Entity      │ │   Edge      │ │  Triples  │
     │              │ │  Entity     │ │           │
     └──────┬───────┘ └──────┬──────┘ └───────────┘
            │               │
            └───────┬───────┘
                    │
           ┌────────▼────────┐
           │   GraphQL API   │
           │  (Apollo Server)│
           └────────┬────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼───┐   ┌──────▼─────┐  ┌────▼────┐
│ Frontend│   │  3rd Party │  │ RDF    │
│   DApp  │   │    API     │  │ Export │
└─────────┘   └────────────┘  └─────────┘
```

## Components

### 1. Event Indexer (`src/indexer/eventListener.ts`)
Listens to Portaldot ink! contract events and stores them in the database.

**Events Monitored:**
- `SBTMinted` - New identity node created
- `RelationshipCreated` - New trust relationship established
- `RelationshipRevoked` - Trust relationship revoked
- `SBTMetadataUpdated` - Identity metadata changed

### 2. GraphQL API (`src/graphql/`)
Provides a rich query interface for the identity graph.

**Main Queries:**
- `nodes` - List all SBT identity nodes
- `relationships` - Query trust relationships
- `searchNodes` - Full-text search on node metadata
- `findPath` - Find connection paths between nodes
- `getEndorsedNodes` - Get nodes endorsed by a specific entity
- `getCollaborators` - Get collaborators of a node

### 3. Graph Service (`src/services/GraphService.ts`)
Transforms stored data into RDF knowledge graph format.

**Output Formats:**
- Graph nodes and edges
- RDF triples
- Turtle/RDF export

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Installation

```bash
cd backend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `CHAIN_ENDPOINT` - Portaldot chain websocket endpoint
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL connection
- `GRAPHQL_PORT` - Port for GraphQL API (default: 4000)

### Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE sovereigngraph;"
```

### Running Services

**Start Indexer (listening for events):**
```bash
npm run Indexer:start
```

**Start GraphQL API:**
```bash
npm run graphql:start
```

**Development mode (both services):**
```bash
npm run dev
```

## GraphQL API Usage

### Query Examples

**Get all active nodes:**
```graphql
query {
  nodes(first: 100, isActive: true) {
    id
    displayName
    entityType
    createdAt
  }
}
```

**Get node statistics:**
```graphql
query {
  getGraphStats {
    totalNodes
    totalEdges
    activeNodes
    verifiedEdges
  }
}
```

**Find path between two nodes:**
```graphql
query {
  findPath(fromNodeId: "node1", toNodeId: "node2", maxDepth: 5) {
    id
    displayName
  }
}
```

**Get collaborators:**
```graphql
query {
  getCollaborators(
    nodeId: "did:portaldot:123",
    relationshipTypes: [TEAM_FORMATION, CODE_CONTRIBUTION]
  ) {
    id
    displayName
  }
}
```

## Event Types

### SBT Minted Event
```typescript
{
  sbt_id: string;
  owner: string;
  entity_type: 'HUMAN' | 'AI_AGENT' | 'ORGANIZATION';
  metadata_uri?: string;
  display_name?: string;
  description?: string;
  attributes?: Record<string, any>;
}
```

### Relationship Created Event
```typescript
{
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: 'TEAM_FORMATION' | 'CODE_CONTRIBUTION' | 'BUSINESS_ENDORSEMENT' | 'SOCIAL_GRAPH' | 'REPUTATION_SHARE';
  strength: 'WEAK' | 'MEDIUM' | 'STRONG';
  zk_proof?: string;
  encrypted_metadata?: Record<string, any>;
  creator?: string;
}
```

## License

MIT

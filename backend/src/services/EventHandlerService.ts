import { AppDataSource } from '../database';
import { SbtNode, EntityType } from '../models/SbtNode';
import { RelationshipEdge, RelationshipStrength } from '../models/RelationshipEdge';

export interface ContractEvent {
  id: string;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
  args: Record<string, any>;
}

export interface EventHandler {
  handleSbtMinted(event: ContractEvent): Promise<void>;
  handleRelationshipCreated(event: ContractEvent): Promise<void>;
  handleRelationshipRevoked(event: ContractEvent): Promise<void>;
  handleSbtMetadataUpdated(event: ContractEvent): Promise<void>;
}

class EventHandlerService implements EventHandler {
  async handleSbtMinted(event: ContractEvent): Promise<void> {
    const manager = AppDataSource.manager;
    const { sbt_id, sbtId, owner, entity_type, entityType, metadata_uri, metadataUri, display_name, displayName, description, attributes } = event.args;

    const sbtIdValue = sbt_id || sbtId;
    const entityTypeValue = entity_type || entityType || EntityType.HUMAN;
    const metadataUriValue = metadata_uri || metadataUri || null;
    const displayNameValue = display_name || displayName || null;
    const descriptionValue = description || null;
    const attributesValue = attributes || null;

    const existingNode = await manager.findOne(SbtNode, { where: { id: sbtIdValue } });
    if (existingNode) {
      console.log(`[EventHandler] SBT already exists: ${sbtIdValue}, skipping...`);
      return;
    }

    const sbtNode = manager.create(SbtNode, {
      id: sbtIdValue,
      owner: owner,
      entityType: entityTypeValue,
      metadataUri: metadataUriValue,
      displayName: displayNameValue,
      description: descriptionValue,
      attributes: attributesValue,
      isActive: true,
      blockNumber: event.blockNumber.toString(),
      transactionHash: event.transactionHash,
      createdAt: event.timestamp,
    });

    await manager.save(sbtNode);
    console.log(`[EventHandler] SBT Minted: ${sbtIdValue} owned by ${owner}`);
  }

  async handleRelationshipCreated(event: ContractEvent): Promise<void> {
    const manager = AppDataSource.manager;
    const {
      edge_id,
      edgeId,
      source_node_id,
      sourceNodeId,
      target_node_id,
      targetNodeId,
      relationship_type,
      relationshipType,
      zk_proof,
      zkProof,
      encrypted_metadata,
      encryptedMetadata,
      strength,
      creator,
    } = event.args;

    const edgeIdValue = edge_id || edgeId;
    const sourceNodeIdValue = source_node_id || sourceNodeId;
    const targetNodeIdValue = target_node_id || targetNodeId;
    const relationshipTypeValue = relationship_type || relationshipType;
    const zkProofValue = zk_proof || zkProof || null;
    const encryptedMetadataValue = encrypted_metadata || encryptedMetadata || null;
    const strengthValue = strength || RelationshipStrength.MEDIUM;
    const creatorValue = creator || '0x0000000000000000000000000000000000000000';

    const existingEdge = await manager.findOne(RelationshipEdge, { where: { id: edgeIdValue } });
    if (existingEdge) {
      console.log(`[EventHandler] Relationship edge already exists: ${edgeIdValue}, skipping...`);
      return;
    }

    const relationshipEdge = manager.create(RelationshipEdge, {
      id: edgeIdValue,
      sourceNodeId: sourceNodeIdValue,
      targetNodeId: targetNodeIdValue,
      relationshipType: relationshipTypeValue,
      strength: strengthValue,
      zkProof: zkProofValue,
      encryptedMetadata: encryptedMetadataValue,
      isVerified: true,
      isRevoked: false,
      creator: creatorValue,
      blockNumber: event.blockNumber.toString(),
      transactionHash: event.transactionHash,
      createdAt: event.timestamp,
    });

    await manager.save(relationshipEdge);
    console.log(`[EventHandler] Relationship Created: ${sourceNodeIdValue} -> ${targetNodeIdValue} (${relationshipTypeValue})`);
  }

  async handleRelationshipRevoked(event: ContractEvent): Promise<void> {
    const manager = AppDataSource.manager;
    const { edge_id, edgeId, reason } = event.args;

    const edgeIdValue = edge_id || edgeId;

    const existingEdge = await manager.findOne(RelationshipEdge, { where: { id: edgeIdValue } });
    if (!existingEdge) {
      console.log(`[EventHandler] Relationship edge not found: ${edgeIdValue}, skipping...`);
      return;
    }

    await manager.update(RelationshipEdge, { id: edgeIdValue }, {
      isRevoked: true,
      revokedAt: event.timestamp,
      revocationReason: reason || null,
    });

    console.log(`[EventHandler] Relationship Revoked: ${edgeIdValue}`);
  }

  async handleSbtMetadataUpdated(event: ContractEvent): Promise<void> {
    const manager = AppDataSource.manager;
    const { sbt_id, sbtId, display_name, displayName, description, attributes, metadata_uri, metadataUri } = event.args;

    const sbtIdValue = sbt_id || sbtId;

    const existingNode = await manager.findOne(SbtNode, { where: { id: sbtIdValue } });
    if (!existingNode) {
      console.log(`[EventHandler] SBT node not found: ${sbtIdValue}, skipping...`);
      return;
    }

    const updateData: any = {
      updatedAt: event.timestamp,
    };

    if (display_name !== undefined || displayName !== undefined) {
      updateData.displayName = display_name || displayName;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (attributes !== undefined) {
      updateData.attributes = attributes;
    }
    if (metadata_uri !== undefined || metadataUri !== undefined) {
      updateData.metadataUri = metadata_uri || metadataUri;
    }

    await manager.update(SbtNode, { id: sbtIdValue }, updateData);
    console.log(`[EventHandler] SBT Metadata Updated: ${sbtIdValue}`);
  }

  async processEvent(event: ContractEvent): Promise<void> {
    console.log(`[EventHandler] Processing event: ${event.id}`);

    try {
      if (event.id.includes('SBTMinted') || event.id.includes('SBT_MINTED')) {
        await this.handleSbtMinted(event);
      } else if (event.id.includes('RelationshipCreated') || event.id.includes('RELATIONSHIP_CREATED')) {
        await this.handleRelationshipCreated(event);
      } else if (event.id.includes('RelationshipRevoked') || event.id.includes('RELATIONSHIP_REVOKED')) {
        await this.handleRelationshipRevoked(event);
      } else if (event.id.includes('SBTMetadataUpdated') || event.id.includes('SBT_METADATA_UPDATED')) {
        await this.handleSbtMetadataUpdated(event);
      } else {
        console.log(`[EventHandler] Unknown event type: ${event.id}`);
      }
    } catch (error) {
      console.error(`[EventHandler] Error processing event ${event.id}:`, error);
      throw error;
    }
  }
}

export const eventHandler = new EventHandlerService();

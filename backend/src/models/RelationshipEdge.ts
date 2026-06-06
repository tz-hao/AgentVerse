import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum RelationshipType {
  TEAM_FORMATION = 'TEAM_FORMATION',
  CODE_CONTRIBUTION = 'CODE_CONTRIBUTION',
  BUSINESS_ENDORSEMENT = 'BUSINESS_ENDORSEMENT',
  SOCIAL_GRAPH = 'SOCIAL_GRAPH',
  REPUTATION_SHARE = 'REPUTATION_SHARE',
}

export enum RelationshipStrength {
  WEAK = 'WEAK',
  MEDIUM = 'MEDIUM',
  STRONG = 'STRONG',
}

@Entity('relationship_edges')
@Index(['sourceNodeId'])
@Index(['targetNodeId'])
@Index(['relationshipType'])
@Index(['createdAt'])
export class RelationshipEdge {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  sourceNodeId!: string;

  @Column({ type: 'varchar', length: 64 })
  targetNodeId!: string;

  @Column({ type: 'varchar', length: 64 })
  relationshipType!: RelationshipType;

  @Column({ type: 'varchar', length: 32 })
  strength!: RelationshipStrength;

  @Column({ type: 'text', nullable: true })
  zkProof!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  encryptedMetadata!: Record<string, any> | null;

  @Column({ type: 'boolean', default: true })
  isVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isRevoked!: boolean;

  @Column({ type: 'varchar', length: 256 })
  creator!: string;

  @Column({ type: 'varchar', length: 64 })
  blockNumber!: string;

  @Column({ type: 'varchar', length: 128 })
  transactionHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  revocationReason!: string | null;
}
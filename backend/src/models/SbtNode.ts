import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum EntityType {
  HUMAN = 'HUMAN',
  AI_AGENT = 'AI_AGENT',
  ORGANIZATION = 'ORGANIZATION',
}

@Entity('sbt_nodes')
@Index(['entityType'])
@Index(['createdAt'])
export class SbtNode {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 256 })
  owner!: string;

  @Column({ type: 'varchar', length: 64 })
  entityType!: EntityType;

  @Column({ type: 'text', nullable: true })
  metadataUri!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  displayName!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  attributes!: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 64 })
  blockNumber!: string;

  @Column({ type: 'varchar', length: 128 })
  transactionHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  updatedAt!: Date | null;
}
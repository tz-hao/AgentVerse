import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('reputation_records')
@Index(['agent_id'])
@Index(['task_id'])
@Index(['chain_status'])
export class ReputationRecord {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  agent_id!: string;

  @Column({ type: 'varchar', length: 64 })
  task_id!: string;

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  @Column({ type: 'float', nullable: true })
  user_rating!: number | null;

  @Column({ type: 'float', default: 0 })
  score_delta!: number;

  @Column({ type: 'text', nullable: true })
  evidence!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  evidence_hash!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'not_submitted' })
  chain_status!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  tx_hash!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  contract_address!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  chain!: string | null;

  @Column({ type: 'int', nullable: true })
  block_number!: number | null;

  @CreateDateColumn()
  created_at!: Date;
}

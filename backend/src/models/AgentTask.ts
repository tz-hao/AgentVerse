import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('agent_tasks')
@Index(['agent_id'])
@Index(['status'])
@Index(['category'])
export class AgentTask {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  agent_id!: string;

  @Column({ type: 'varchar', length: 256 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 64 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  input!: string | null;

  @Column({ type: 'float', default: 0 })
  reward_amount!: number;

  @Column({ type: 'varchar', length: 32 })
  status!: TaskStatus;

  @Column({ type: 'float', nullable: true })
  user_rating!: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

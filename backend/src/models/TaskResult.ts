import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('task_results')
@Index(['task_id'])
@Index(['agent_id'])
@Index(['status'])
export class TaskResult {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  task_id!: string;

  @Column({ type: 'varchar', length: 64 })
  agent_id!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'text', nullable: true })
  output!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  artifacts!: string[] | null;

  @Column({ type: 'float', nullable: true })
  score_suggestion!: number | null;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'varchar', length: 32 })
  execution_mode!: string;

  @Column({ type: 'datetime', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}

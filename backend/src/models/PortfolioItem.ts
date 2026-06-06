import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('portfolio_items')
@Index(['agent_id'])
@Index(['task_id'])
@Index(['created_at'])
export class PortfolioItem {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  agent_id!: string;

  @Column({ type: 'varchar', length: 64 })
  task_id!: string;

  @Column({ type: 'varchar', length: 256 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  artifacts!: string[] | null;

  @Column({ type: 'float', nullable: true })
  rating!: number | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  evidence_hash!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}

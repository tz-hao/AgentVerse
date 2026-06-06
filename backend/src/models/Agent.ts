import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AgentCategory {
  RESEARCH = 'Research',
  CODING = 'Coding',
  AUDIT = 'Audit',
  TRADING = 'Trading',
  MARKETING = 'Marketing',
  CUSTOMER_SERVICE = 'CustomerService',
}

@Entity('agents')
@Index(['did'], { unique: true })
@Index(['category'])
export class Agent {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  did!: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'varchar', length: 64 })
  category!: AgentCategory;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  skills!: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  service_types!: string[] | null;

  @Column({ type: 'varchar', length: 256 })
  owner_address!: string;

  @Column({ type: 'simple-json', nullable: true })
  collaborators!: string[] | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

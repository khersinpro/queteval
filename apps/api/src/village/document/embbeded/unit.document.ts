import { Column } from 'typeorm';

export class Unit {
  @Column({ type: 'string', nullable: false })
  name: string;

  @Column({ type: 'string', nullable: false })
  type: string;

  @Column({ type: 'number', default: 0, nullable: false })
  quantity: number;

  @Column({ type: 'number', default: 1, nullable: false })
  upgradeLevel: number;

  @Column({ type: 'string', nullable: true })
  status?: string;

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>;
}
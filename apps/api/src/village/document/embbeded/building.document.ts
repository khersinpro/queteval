import { Column, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export class Building {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ type: 'string', nullable: false })
  name: string;

  @Column({ type: 'string', nullable: false })
  type: string;

  @Column({ type: 'number', default: 1, nullable: false })
  level: number;

  @Column({ type: 'string', nullable: true })
  state?: string;

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>;

  constructor() {
      if (!this._id) {
          this._id = new ObjectId();
      }
  }
}
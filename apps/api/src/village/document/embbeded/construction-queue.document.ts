import { Column, CreateDateColumn, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export class ConstructionQueueItem {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ nullable: false })
  buildingInstanceId: ObjectId;

  @Column({ type: 'string', nullable: false })
  buildingName: string;

  @Column({ type: 'number', nullable: false })
  targetLevel: number;

  @Column({ type: 'timestamp', nullable: false })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: false })
  endTime: Date;

  @Column({ nullable: false }) // Stocke l'ID, pas de 'ref' direct
  gameEventId: ObjectId;

  @Column({ type: 'string', nullable: true })
  jobId?: string; // Lien vers un job BullMQ par exemple

  // Créer le champ 'queuedAt' au lieu de 'createdAt'
  @CreateDateColumn({ name: 'queuedAt', type: 'timestamp' })
  queuedAt: Date;

  constructor() {
    if (!this._id) {
      this._id = new ObjectId();
    }
  }
}

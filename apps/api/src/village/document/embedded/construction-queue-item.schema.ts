// src/village/schema/embedded/construction-queue-item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ timestamps: { createdAt: 'queuedAt', updatedAt: false } }) // Créer 'queuedAt' au lieu de 'createdAt', pas d''updatedAt'
export class ConstructionQueueItem {
  // Mongoose ajoute _id: ObjectId par défaut

  _id: ObjectId; // Déclaré pour le type TS

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  buildingInstanceId: ObjectId; // Référence l'_id d'un Building dans le tableau 'buildings'

  @Prop({ type: String, required: true })
  buildingName: string;

  @Prop({ type: Number, required: true })
  targetLevel: number;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true, index: true }) // Index comme dans TypeORM
  endTime: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  buildingJobId: ObjectId; // Référence l'_id d'un BuildingJob

  @Prop({ type: String, required: false })
  queuedJobId?: string; // Lien vers BullMQ

  // Le champ 'queuedAt' est géré par l'option timestamps
  queuedAt?: Date; // Déclaré pour le type TS

  // Le constructeur TypeORM pour _id n'est plus nécessaire
}

export const ConstructionQueueItemSchema = SchemaFactory.createForClass(
  ConstructionQueueItem,
);

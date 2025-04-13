import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AbstractGameJob } from './abstract/abstract-game-job.schema'; // Importer la classe de base TS
import { ObjectId } from 'mongodb';

// Pas besoin de collection ou discriminatorKey ici, hérité de la base
@Schema()
export class BuildingJob extends AbstractGameJob {
  // Héritage de classe TS
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  buildingInstanceId: ObjectId;

  @Prop({ type: Number, required: true })
  targetLevel: number;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;
}

export type BuildingJobDocument = HydratedDocument<BuildingJob>;
// Important : Créer le schéma pour la classe enfant
export const BuildingJobSchema = SchemaFactory.createForClass(BuildingJob);

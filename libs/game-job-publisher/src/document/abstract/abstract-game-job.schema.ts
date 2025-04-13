import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { GAME_JOB_TYPES } from '@app/game-job-publisher/constant/game-job-types.enum';
import { GAME_JOB_STATUS } from '@app/game-job-publisher/constant/game-job-status.enum';
import { ObjectId } from 'mongodb'; // Peut toujours être utilisé pour le type TS

// Options du schéma Mongoose
const schemaOptions = {
  collection: 'GameJob', // Nom de la collection
  timestamps: true, // Active createdAt et updatedAt automatiquement
  discriminatorKey: 'JobType', // Définit le champ qui distinguera les types de jobs
};

@Schema(schemaOptions)
export class AbstractGameJob {
  JobType: GAME_JOB_TYPES; // Le type TS reste l'enum

  @Prop({
    type: String, // Stocké comme String
    required: true,
    enum: Object.values(GAME_JOB_STATUS), // Validation par Mongoose
    default: GAME_JOB_STATUS.SCHEDULED,
  })
  status: GAME_JOB_STATUS; // Le type TS reste l'enum

  // Stocker l'ObjectId. Pas besoin de 'ref' si ce n'est pas une population Mongoose.
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  originVillageId: ObjectId; // Le type TS peut rester ObjectId

  @Prop({ type: String, required: false, index: true }) // Index comme dans TypeORM
  queuedJobId?: string;

  @Prop({ type: Date, required: false })
  completedAt?: Date;

  // Utiliser Mixed pour les objets non structurés ou Record<string, any>
  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  result?: Record<string, any> | { error?: string; warning?: string };

  // createdAt et updatedAt sont ajoutés par l'option timestamps: true
  // Si vous avez besoin d'y accéder dans votre classe TS :
  createdAt?: Date;
  updatedAt?: Date;
}

export type AbstractGameJobDocument = HydratedDocument<AbstractGameJob>;
export const AbstractGameJobSchema =
  SchemaFactory.createForClass(AbstractGameJob);

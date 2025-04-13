// src/village/schema/embedded/building.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ timestamps: false }) // Pas de timestamps createdAt/updatedAt pour ce sous-document a priori
export class Building {
  // Mongoose ajoute _id: ObjectId par défaut, pas besoin de @Prop sauf si customisation

  // _id est automatiquement ajouté par Mongoose, mais on peut le déclarer pour le type TS
  _id: ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Number, required: true, default: 1 })
  level: number;

  @Prop({ type: String, required: false })
  state?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  metadata?: Record<string, any>;

  // Le constructeur TypeORM pour _id n'est plus nécessaire
}

export const BuildingSchema = SchemaFactory.createForClass(Building);

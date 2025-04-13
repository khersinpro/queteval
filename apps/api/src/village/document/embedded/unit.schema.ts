// src/village/schema/embedded/unit.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: false }) // Pas d'_id distinct
export class Unit {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Number, required: true, default: 0 })
  quantity: number;

  @Prop({ type: Number, required: true, default: 1 })
  upgradeLevel: number;

  @Prop({ type: String, required: false })
  status?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  metadata?: Record<string, any>;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Building {
  @Prop({
    type: Types.ObjectId,
    default: () => new Types.ObjectId(),
  })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 1 })
  level: number;

  @Prop()
  state?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export type BuildingDocument = Building & Document;

export const BuildingSchema = SchemaFactory.createForClass(Building);

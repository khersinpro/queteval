// src/village/schema/embedded/location.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Location {
  @Prop({ type: Number, required: true })
  x: number;

  @Prop({ type: Number, required: true })
  y: number;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

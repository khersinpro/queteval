// src/village/schema/embedded/resource-info.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false }) // Pas d'_id distinct pour ce sous-document
export class ResourceInfo {
  @Prop({ type: Number, required: true, default: 500 })
  current: number;

  @Prop({ type: Number, required: true, default: 0 })
  productionPerHour: number;

  // Utilisons 500 pour correspondre à votre constante DEFAULT_VILLAGE_RESOURCES
  @Prop({ type: Number, required: true, default: 500 })
  capacity: number;
}

export const ResourceInfoSchema = SchemaFactory.createForClass(ResourceInfo);

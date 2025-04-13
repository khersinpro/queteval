// src/village/schema/embedded/resources.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ResourceInfo, ResourceInfoSchema } from './resource-info.schema';

// Fonction pour générer les valeurs par défaut
const defaultResource = (): ResourceInfo => ({
  current: 500,
  productionPerHour: 0,
  capacity: 500,
});

@Schema({ _id: false }) // Pas d'_id distinct
export class Resources {
  @Prop({ type: ResourceInfoSchema, required: true, default: defaultResource })
  wood: ResourceInfo;

  @Prop({ type: ResourceInfoSchema, required: true, default: defaultResource })
  clay: ResourceInfo;

  @Prop({ type: ResourceInfoSchema, required: true, default: defaultResource })
  iron: ResourceInfo;

  @Prop({ type: ResourceInfoSchema, required: true, default: defaultResource })
  crop: ResourceInfo;
}

export const ResourcesSchema = SchemaFactory.createForClass(Resources);

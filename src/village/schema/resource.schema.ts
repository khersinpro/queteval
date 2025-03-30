import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ResourceInfo {
  @Prop({ required: true, default: 500 })
  current: number;

  @Prop({ default: 0 })
  productionPerHour: number;

  @Prop({ default: 250 })
  capacity: number;
}

export const ResourceInfoSchema = SchemaFactory.createForClass(ResourceInfo);

@Schema({ _id: false })
export class Resources {
  @Prop({ type: ResourceInfoSchema, required: true })
  wood: ResourceInfo;

  @Prop({ type: ResourceInfoSchema, required: true })
  clay: ResourceInfo;

  @Prop({ type: ResourceInfoSchema, required: true })
  iron: ResourceInfo;

  @Prop({ type: ResourceInfoSchema, required: true })
  crop: ResourceInfo;
}

export const ResourcesSchema = SchemaFactory.createForClass(Resources);

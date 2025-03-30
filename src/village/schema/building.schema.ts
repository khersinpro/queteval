import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Building {
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

export const BuildingSchema = SchemaFactory.createForClass(Building);

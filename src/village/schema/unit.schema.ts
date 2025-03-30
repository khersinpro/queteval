import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Unit {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ default: 1 })
  upgradeLevel: number;

  @Prop()
  status?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

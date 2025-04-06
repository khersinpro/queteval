import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: true, timestamps: { createdAt: 'queuedAt' } })
export class ConstructionQueueItem extends mongoose.Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  buildingInstanceId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  buildingName: string;

  @Prop({ type: Number, required: true })
  targetLevel: number;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true, index: true })
  endTime: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameEvent',
    required: true,
  })
  gameEventId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: false })
  jobId?: string;
}

export const ConstructionQueueItemSchema = SchemaFactory.createForClass(
  ConstructionQueueItem,
);

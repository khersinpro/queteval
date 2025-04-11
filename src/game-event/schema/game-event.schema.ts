import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Village } from '../../village/schema/village.schema';
import { GameEventType } from '../types/event.enum';
import { GameEventStatus } from '../types/game-event-status.enum';

const baseSchemaOptions: mongoose.SchemaOptions = {
  timestamps: true,
  collection: 'GameEvent',
  discriminatorKey: 'eventType',
};

export type GameEventDocument = mongoose.HydratedDocument<GameEvent>;

@Schema(baseSchemaOptions)
export class GameEvent {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(GameEventType),
    index: true,
  })
  eventType: GameEventType;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(GameEventStatus),
    default: GameEventStatus.SCHEDULED,
    index: true,
  })
  status: GameEventStatus;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Village.name,
    required: true,
    index: true,
  })
  originVillageId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Village.name,
    required: false,
    index: true,
  })
  targetVillageId?: mongoose.Types.ObjectId;

  @Prop({ type: String, index: true, required: false })
  jobId?: string;

  @Prop({ required: false })
  completedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  result?: Record<string, any> | { error?: string; warning?: string };
}

export const GameEventSchema = SchemaFactory.createForClass(GameEvent);

export class BuildingEvent {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  })
  buildingInstanceId: mongoose.Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  targetLevel: number;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true, index: true })
  endTime: Date;
}


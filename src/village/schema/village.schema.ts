import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Resources, ResourcesSchema } from './resource.schema';
import { Building, BuildingSchema } from './building.schema';
import { Unit, UnitSchema } from './unit.schema';
import {
  ConstructionQueueItem,
  ConstructionQueueItemSchema,
} from './construction-queue.schema';

const DEFAULT_VILLAGE_RESOURCES: Resources = {
  wood: { current: 500, productionPerHour: 0, capacity: 500 },
  clay: { current: 500, productionPerHour: 0, capacity: 500 },
  iron: { current: 500, productionPerHour: 0, capacity: 500 },
  crop: { current: 500, productionPerHour: 0, capacity: 500 },
};

export type VillageDocument = HydratedDocument<Village>;

@Schema({ collection: 'village' })
export class Village {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  faction: string;

  @Prop({
    type: ResourcesSchema,
    required: true,
    default: DEFAULT_VILLAGE_RESOURCES,
  })
  resources: Resources;

  @Prop({ type: [BuildingSchema], default: [] })
  buildings: Building[];

  @Prop({ type: [UnitSchema], default: [] })
  units: Unit[];

  @Prop({ type: [ConstructionQueueItemSchema], default: [] })
  constructionQueue: ConstructionQueueItem[];

  @Prop({
    required: false,
    type: {
      x: Number,
      y: Number,
    },
  })
  location?: {
    x: number;
    y: number;
  };

  @Prop({ type: Object, required: false })
  config?: Record<string, any>;
}

export const VillageSchema = SchemaFactory.createForClass(Village);

// src/village/schema/village.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Resources, ResourcesSchema } from './embedded/resources.schema';
import { Building, BuildingSchema } from './embedded/building.schema';
import { Unit, UnitSchema } from './embedded/unit.schema';
import {
  ConstructionQueueItem,
  ConstructionQueueItemSchema,
} from './embedded/construction-queue-item.schema';
import { Location, LocationSchema } from './embedded/location.schema';

// Fonction pour les ressources par défaut
const defaultResources = () => ({
  wood: { current: 500, productionPerHour: 0, capacity: 500 },
  clay: { current: 500, productionPerHour: 0, capacity: 500 },
  iron: { current: 500, productionPerHour: 0, capacity: 500 },
  crop: { current: 500, productionPerHour: 0, capacity: 500 },
});

@Schema({ collection: 'Village', timestamps: true }) // Collection et timestamps standards
export class Village {
  // _id: ObjectId est ajouté par Mongoose

  @Prop({ type: Number, required: true })
  userId: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  faction: string;

  // Objet Resources imbriqué
  @Prop({ type: ResourcesSchema, required: true, default: defaultResources })
  resources: Resources;

  // Tableau de Buildings imbriqués (avec leur propre _id)
  @Prop({ type: [BuildingSchema], default: [] })
  buildings: Types.DocumentArray<Building>; // Utiliser Types.DocumentArray pour les méthodes Mongoose sur le tableau

  // Tableau de Units imbriqués (sans _id propre)
  @Prop({ type: [UnitSchema], default: [] })
  units: Types.DocumentArray<Unit>;

  // Tableau de ConstructionQueueItems imbriqués (avec leur propre _id et queuedAt)
  @Prop({ type: [ConstructionQueueItemSchema], default: [] })
  constructionQueue: Types.DocumentArray<ConstructionQueueItem>;

  // Tableau simple de strings (ajouté dans votre exemple TypeORM)
  @Prop({ type: [String], default: [] })
  simpleArray: string[];

  // Objet Location imbriqué optionnel (sans _id propre)
  @Prop({ type: LocationSchema, required: false })
  location?: Location;

  // Config flexible
  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  config?: Record<string, any>;

  // createdAt et updatedAt gérés par timestamps: true
  createdAt?: Date;
  updatedAt?: Date;

  // Le constructeur TypeORM n'est plus nécessaire pour initialiser les tableaux/objets avec les options 'default' de Mongoose
}

export type VillageDocument = HydratedDocument<Village>;
export const VillageSchema = SchemaFactory.createForClass(Village);

import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn, // Ajouté pour la cohérence, même si non présent dans Mongoose
  UpdateDateColumn, // Ajouté pour la cohérence
} from 'typeorm';
import { ObjectId } from 'mongodb';
import { Resources } from './embbeded/resource.document';
import { Building } from './embbeded/building.document';
import { Unit } from './embbeded/unit.document';
import { ConstructionQueueItem } from './embbeded/construction-queue.document';
import { Location } from './embbeded/location.document';



const DEFAULT_VILLAGE_RESOURCES: Resources = {
  wood: { current: 500, productionPerHour: 0, capacity: 500 },
  clay: { current: 500, productionPerHour: 0, capacity: 500 },
  iron: { current: 500, productionPerHour: 0, capacity: 500 },
  crop: { current: 500, productionPerHour: 0, capacity: 500 },
};


@Entity('Village') // Nom de la collection
export class Village {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ type: 'number', nullable: false }) // userId était 'number' dans Mongoose
  userId: number;

  @Column({ type: 'string', nullable: false })
  name: string;

  @Column({ type: 'string', nullable: false })
  faction: string;

  // Imbriquer l'objet Resources. La valeur par défaut est gérée à l'instanciation.
  @Column(type => Resources)
  resources: Resources;

  // Imbriquer un tableau de Building. Le défaut [] est implicite.
  @Column(type => Building)
  buildings: Building[];

  // Imbriquer un tableau de Unit
  @Column(type => Unit)
  units: Unit[];

  // Imbriquer un tableau de ConstructionQueueItem
  @Column(type => ConstructionQueueItem)
  constructionQueue: ConstructionQueueItem[];

  // Imbriquer l'objet Location (optionnel)
  @Column(type => Location)
  location?: Location;

  // Config reste un objet JSON flexible
  @Column('simple-json', { nullable: true })
  config?: Record<string, any>;

  // Ajout optionnel des timestamps standards de TypeORM si souhaité
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Constructeur pour initialiser les valeurs par défaut complexes/tableaux
  constructor() {
      this.resources = new Resources(); // Initialise avec les defaults de ResourceInfo
      this.buildings = [];
      this.units = [];
      this.constructionQueue = [];
      // Object.assign(this.resources, DEFAULT_VILLAGE_RESOURCES);
  }
}
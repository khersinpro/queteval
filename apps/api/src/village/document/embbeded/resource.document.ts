import { Column } from 'typeorm';

export class ResourceInfo {
  @Column({ type: 'number', default: 500, nullable: false })
  current: number;

  @Column({ type: 'number', default: 0, nullable: false })
  productionPerHour: number;

  @Column({ type: 'number', default: 250, nullable: false }) // Note: Default était 500 dans Mongoose, mais 250 ici? J'utilise 500 comme dans l'objet default. Clarifiez si nécessaire.
  capacity: number;
}

export class Resources {
  wood: ResourceInfo;

  clay: ResourceInfo;

  iron: ResourceInfo;

  crop: ResourceInfo;

  constructor() {
      this.wood = new ResourceInfo();
      this.clay = new ResourceInfo();
      this.iron = new ResourceInfo();
      this.crop = new ResourceInfo();
  }
}

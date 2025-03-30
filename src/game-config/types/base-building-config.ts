export interface BaseLevelConfig {
  cost: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  upgrade_time: number;
}

export interface ResourceLevelConfig extends BaseLevelConfig {
  production: number;
}

export interface StorageLevelConfig extends BaseLevelConfig {
  capacity: number;
}

export type BuildingType =
  | 'resource'
  | 'storage'
  | 'military'
  | 'defense'
  | 'faction'
  | 'common';

export type ResourceType = 'wood' | 'clay' | 'iron' | 'crop';

export interface BaseBuildingConfig {
  name: string;
  type: BuildingType;
}

export interface ResourceBuildingConfig extends BaseBuildingConfig {
  type: 'resource';
  resource_type: ResourceType;
  levels: Record<number, ResourceLevelConfig>;
}

export interface StorageBuildingConfig extends BaseBuildingConfig {
  type: 'storage';
  storage_type: ResourceType;
  levels: Record<number, StorageLevelConfig>;
}

export type BuildingConfig = ResourceBuildingConfig | StorageBuildingConfig;

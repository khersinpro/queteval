import { Injectable, OnModuleInit } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { BuildingConfig } from '../types/base-building-config';
import { getAllYamlFiles } from '../utils/yaml-utils';

@Injectable()
export class BuildingConfigService implements OnModuleInit {
  private configs: Record<string, BuildingConfig> = {};

  onModuleInit() {
    this.loadConfigs();
  }

  private loadConfigs() {
    // Par exemple, tu pars de config/buildings
    const baseDir = path.join(process.cwd(), 'game-config-yaml', 'buildings');

    // Récupère la liste de TOUS les fichiers .yaml / .yml (dans tous les sous-dossiers)
    const yamlFiles = getAllYamlFiles(baseDir);

    // Pour chacun, on lit et on parse
    yamlFiles.forEach((filePath) => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.load(fileContent) as BuildingConfig;

      // On utilise le champ "name" comme clé
      if (!parsed?.name) {
        // Gérer le cas où le YAML n'aurait pas de "name"
        // Tu peux lever une erreur ou ignorer
        console.warn(
          `Le fichier ${filePath} ne contient pas la propriété "name". Ignoré.`,
        );
        return;
      }

      // On stocke la config dans un dictionnaire
      this.configs[parsed.name] = parsed;
    });
  }

  getBuildingConfig<T extends BuildingConfig>(name: string): T | undefined {
    return this.configs[name] as T | undefined;
  }

  getBuildingLevelConfig(name: string, level: number) {
    const buildingConfig = this.getBuildingConfig(name);
    if (!buildingConfig) {
      throw new Error(`Bâtiment ${name} introuvable`);
    }
    const levelConfig = buildingConfig.levels[level];
    if (!levelConfig) {
      throw new Error(`Niveau ${level} introuvable pour ${name}`);
    }
    return levelConfig;
  }
}

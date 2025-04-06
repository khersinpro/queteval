import * as fs from 'fs';
import * as path from 'path';

/**
 * Parcourt récursivement un dossier et retourne la liste des chemins complets
 * pour tous les fichiers .yaml ou .yml qu'il contient (y compris ses sous-dossiers).
 */
export function getAllYamlFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const fileOrFolder of list) {
    const fullPath = path.join(dir, fileOrFolder);
    const stat = fs.statSync(fullPath);

    // Si c'est un dossier, on appelle la fonction récursivement
    if (stat.isDirectory()) {
      results = results.concat(getAllYamlFiles(fullPath));
    }
    // Si c'est un fichier .yaml ou .yml, on l'ajoute à la liste
    else if (fileOrFolder.endsWith('.yaml') || fileOrFolder.endsWith('.yml')) {
      results.push(fullPath);
    }
  }
  return results;
}

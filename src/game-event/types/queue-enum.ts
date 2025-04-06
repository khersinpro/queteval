// src/queues.enum.ts ou src/common/constants/queues.enum.ts

export enum GameQueue {
  BUILDING = 'building-jobs', // Queue pour les tâches liées aux bâtiments
  UNIT = 'unit-jobs', // Queue pour les tâches liées aux unités
  MOVEMENT = 'movement-jobs', // Queue pour les mouvements de troupes
  TRADE = 'trade-jobs', // Queue pour le commerce
}

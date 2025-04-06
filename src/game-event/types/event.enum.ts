/**
 * Définit les différents types d'événements de jeu
 * qui peuvent être planifiés et traités de manière asynchrone.
 */
export enum GameEventType {
  // --- Construction & Bâtiments ---

  /**
   * Déclenché lorsqu'un bâtiment termine sa construction (niveau 1)
   * ou son amélioration (niveau N -> N+1).
   * Payload typique: villageId, buildingInstanceId, targetLevel
   */
  BUILDING_COMPLETE = 'BUILDING_COMPLETE',

  /**
   * Déclenché lorsqu'une tâche de démolition de bâtiment se termine.
   * Payload typique: villageId, buildingInstanceId, targetLevel (qui serait 0)
   */
  DEMOLITION_COMPLETE = 'DEMOLITION_COMPLETE',

  // --- Recherche & Technologies ---

  /**
   * Déclenché lorsqu'une recherche dans l'Académie/Atelier se termine.
   * Payload typique: villageId, researchId, targetLevel
   */
  RESEARCH_COMPLETE = 'RESEARCH_COMPLETE',

  // --- Production d'Unités ---

  /**
   * Déclenché lorsqu'UNE SEULE unité d'un lot (batch) en cours
   * termine sa formation dans un bâtiment (Caserne, Ecurie...).
   * Payload typique: villageId, buildingInstanceId, batchId, unitType
   */
  UNIT_COMPLETE = 'UNIT_COMPLETE',

  // --- Mouvements de Troupes ---

  /**
   * Déclenché lorsque des troupes (attaque, soutien, espionnage, colonisation...)
   * arrivent à leur village CIBLE.
   * La logique de résolution (combat, ajout soutien...) est déclenchée ici.
   * Payload typique: movementId, originVillageId, targetVillageId, units, missionType ('attack', 'support', 'scout'...)
   */
  TROOP_ARRIVAL = 'TROOP_ARRIVAL',

  /**
   * Déclenché lorsque des troupes retournent à leur village d'ORIGINE
   * après avoir terminé leur mission (attaque, soutien terminé/annulé, etc.).
   * Payload typique: movementId (peut-être le même que l'aller?), originVillageId, unitsReturning
   */
  TROOP_RETURN = 'TROOP_RETURN',

  // --- Commerce ---

  /**
   * Déclenché lorsque des marchands arrivent à leur village CIBLE
   * pour livrer ou récupérer des ressources.
   * Payload typique: tradeId, originVillageId, targetVillageId, resourcesCarried
   */
  TRADE_ARRIVAL = 'TRADE_ARRIVAL',

  /**
   * Déclenché lorsque des marchands retournent à leur village d'ORIGINE
   * après un échange.
   * Payload typique: tradeId, originVillageId, resourcesCarried (si retour avec ressources)
   */
  TRADE_RETURN = 'TRADE_RETURN', // Optionnel, si le retour est pertinent

  /*
    // --- Autres exemples potentiels ---
  
    // Déclenché à la fin d'un siège (si implémenté)
    SIEGE_END = 'SIEGE_END',
  
    // Déclenché lorsqu'un effet temporaire expire (ex: boost de production)
    // Attention: Peut être géré différemment (vérification périodique plutôt que job individuel)
    EFFECT_EXPIRE = 'EFFECT_EXPIRE',
  
    // Lié aux actions d'alliance, etc.
    ALLIANCE_EVENT = 'ALLIANCE_EVENT',
    */
}

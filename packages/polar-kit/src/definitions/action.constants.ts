// ========================================================================
// CLI ACTION DEFINITIONS
// ========================================================================

/**
 * Available CLI actions as const for type safety
 */
export const ACTIONS = {
  CREATE: 'create',
  ARCHIVE: 'archive',
  SYNC: 'sync',
  UPDATE: 'update',
  CLEAR_DB_PLANS: 'clear-db-plans',
  URL: 'url',
  LIST_PRODUCTS: 'list-products',
  LIST_PRICES: 'list-prices',
} as const;

/**
 * Array of valid action values for validation
 */
export const VALID_ACTIONS = Object.values(ACTIONS);

/**
 * Type derived from the ACTIONS const
 */
export type ActionKey = (typeof ACTIONS)[keyof typeof ACTIONS];

// ========================================================================
// ACTION DESCRIPTIONS
// ========================================================================

/**
 * Descriptions for each action used in CLI prompts
 */
export const ACTION_DESCRIPTIONS: Record<ActionKey, string> = {
  [ACTIONS.CREATE]: '[create]: Create Polar subscription plans (Idempotent)',
  [ACTIONS.ARCHIVE]: '[archive]: Archive Polar subscription plans',
  [ACTIONS.SYNC]: '[sync]: Sync Polar subscription plans to database',
  [ACTIONS.UPDATE]: '[update]: Update Polar subscription plans',
  [ACTIONS.CLEAR_DB_PLANS]:
    '[clear-db-plans]: Delete subscription plans from database',
  [ACTIONS.URL]: '[url]: Show Polar dashboard URL',
  [ACTIONS.LIST_PRODUCTS]: '[list-products]: List Polar products',
  [ACTIONS.LIST_PRICES]: '[list-prices]: List Polar prices',
} as const;

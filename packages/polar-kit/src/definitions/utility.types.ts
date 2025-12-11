// ========================================================================
// UTILITY TYPES
// ========================================================================

/**
 * Utility type for flattening intersections
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

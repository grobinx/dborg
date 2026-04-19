
/** 
 * Utility types for making certain properties of a type optional while keeping others required.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making certain properties of a type required while keeping others optional.
 */
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

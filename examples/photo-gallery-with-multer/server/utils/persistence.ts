
/**
 * Provides methods for save and load data for persistence.
 */
export interface Persistence<T> {
  /**
   * Saves the given data.
   * @param data The data to save.
   */
  save(data: T): Promise<void>;

  /**
   * Loads the stored data.
   */
  load(): Promise<T>;
}
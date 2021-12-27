export interface Persistence<T> {
  save(data: T): Promise<void>;
  load(): Promise<T>;
}
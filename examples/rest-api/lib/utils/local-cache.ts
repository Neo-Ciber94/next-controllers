export class LocalCache<T> {
  private readonly data = new Map<string, T>();

  public get(key: string): T | null {
    return this.data.get(key) || null;
  }

  public getOrSet(key: string, factory: () => T): T {
    if (this.has(key)) {
      return this.get(key) as T;
    }

    const value = factory();
    this.set(key, value);
    return value;
  }

  public async getOrSetAsync(key: string, factory: () => Promise<T>): Promise<T> {
    if (this.has(key)) {
      return this.get(key) as T;
    }

    const value = await factory();
    this.set(key, value);
    return value;
  }

  public set(key: string, value: T): void {
    this.data.set(key, value);
  }

  public has(key: string): boolean {
    return this.data.has(key);
  }

  public delete(key: string): boolean {
    return this.data.delete(key);
  }
}

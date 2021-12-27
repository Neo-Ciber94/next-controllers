import { Persistence } from './persistence';
import fs from 'fs/promises';
import path from 'path';

export type UseDiskPersistence<T, TResult> = (data: T) => TResult;

export class DiskPersistence<T extends object> implements Persistence<T> {
  constructor(readonly filepath: string, private readonly initialValue: T) {}

  async use<TResult>(f: UseDiskPersistence<T, TResult>): Promise<TResult> {
    // Loads the data from the file
    const data = await this.load();

    // Make changes to the data
    const result = await f(data);

    // Saves the data to the file
    await this.save(data);

    // Returns the result of the function
    return result;
  }

  async save(data: T): Promise<void> {
    // Creates the directory if it doesn't exist.
    const dirname = path.dirname(this.filepath);
    await fs.mkdir(dirname, { recursive: true });

    const json = JSON.stringify(data);
    await fs.writeFile(this.filepath, json);
  }

  async load(): Promise<T> {
    try {
      const json = await fs.readFile(this.filepath, 'utf-8');
      return JSON.parse(json) as T;
    } catch {
      return this.initialValue;
    }
  }
}

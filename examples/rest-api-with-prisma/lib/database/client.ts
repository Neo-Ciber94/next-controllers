/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/no-namespace */
import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

export module Client {
  export function connect(): PrismaClient {
    if (client == null) {
      client = new PrismaClient();
    }

    return client;
  }

  export async function disconnect(): Promise<void> {
    if (client) {
      await client.$disconnect();
    }
  }
}

/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/no-namespace */
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

export module Client {
  export function connect(): PrismaClient {
    return client;
  }

  export function disconnect(): Promise<void> {
    return client.$disconnect();
  }
}

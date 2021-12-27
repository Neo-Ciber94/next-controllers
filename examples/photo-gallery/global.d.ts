import { Express } from 'express';

declare module 'next' {
  declare interface NextApiRequest {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }
}

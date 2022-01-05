import { DiskPersistence } from '../utils/disk-persistence';

export type FileInfo = {
  id: number;
  originalname: string;
  fileName: string;
  mimetype: string;
};

export type UploadState = {
  lastId: number;
  files: Record<string, FileInfo | undefined>;
};

export type UploadPersistence = DiskPersistence<UploadState>;
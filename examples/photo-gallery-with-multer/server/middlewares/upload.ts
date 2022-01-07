import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import * as uuid from 'uuid';
import sharp from 'sharp';
import { UPLOAD_PATH } from '../../shared';
import { ValidationError } from '../utils/validation-error';

type MulterFile = Express.Multer.File;

const multerOptions: multer.Options = {
  fileFilter: (_, file, cb) => {
    if (file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only images are supported'));
    }
  },
  storage: multer.diskStorage({
    destination: UPLOAD_PATH,
    filename: (_, file, cb) => {
      const filename = uuid.v4().replace(/-/g, '') + path.extname(file.originalname);
      cb(null, filename);
    },
  }),
};

export async function resizeDownAsBase64Image(file: MulterFile, size: number): Promise<string> {
  // MulterFile.buffer is only available for MemoryStorage
  const bytes = await fs.readFile(file.path);
  const buffer = await sharp(bytes).resize(size, size, { fit: 'outside' }).toBuffer();
  const data = buffer.toString('base64');
  return 'data:' + file.mimetype + ';base64,' + data;
}

export const upload = multer(multerOptions);

import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import { UPLOAD_PATH } from '../../shared';
import { ValidationError } from '../utils/validation-error';

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

export const upload = multer(multerOptions);

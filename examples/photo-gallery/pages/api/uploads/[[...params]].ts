import {
  Get,
  Post,
  Delete,
  OnError,
  Results,
  NextApiContext,
  RouteController,
  UseMiddleware,
  withController,
} from 'next-controllers';
import morgan from 'morgan';
import multer from 'multer';
import { DiskPersistence } from '../../../lib/utils/disk-persistence';
import fs from 'fs/promises';
import { UPLOAD_NAME, UPLOAD_PATH } from '../../../shared';

const multerOptions: multer.Options = {
  dest: UPLOAD_PATH,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are supported'));
    }
  },
};

const upload = multer(multerOptions);

// Let multer handle the body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

type FileInfo = {
  id: number;
  originalname: string;
  fileName: string;
  mimetype: string;
};

type UploadState = {
  lastId: number;
  files: Record<string, FileInfo | undefined>;
};

type UploadPersistence = DiskPersistence<UploadState>;

@UseMiddleware(morgan('dev'))
@RouteController({
  state: new DiskPersistence<UploadState>('uploads/state.json', { lastId: 0, files: {} }),
})
class UploadController {
  @Post('/')
  @UseMiddleware(upload.single(UPLOAD_NAME))
  upload({ state, request }: NextApiContext<UploadPersistence>) {
    const file = request.file;

    if (file == null) {
      throw new Error('No file to upload');
    }

    return state.use((uploadState) => {
      const id = ++uploadState.lastId;
      const newFile: FileInfo = {
        id,
        fileName: file.filename,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };

      uploadState.files[id] = newFile;
      return newFile;
    });
  }

  @Get('/:id')
  async getImage({ state, request }: NextApiContext<UploadPersistence>) {
    const uploadState = await state.load();
    const id = request.params.id;

    if (id == null) {
      return Results.badRequest('No id provided');
    }

    const fileInfo = uploadState.files[id];

    if (fileInfo == null) {
      return Results.notFound('File not found');
    }

    const filePath = `${UPLOAD_PATH}${fileInfo.fileName}`;
    return Results.file(filePath, fileInfo.mimetype);
  }

  @Delete('/:id')
  async deleteImage({ state, request }: NextApiContext<UploadPersistence>) {
    const id = request.params.id;

    if (id == null) {
      return Results.badRequest('No id provided');
    }

    const result = await state.use(async (uploadState) => {
      const fileInfo = uploadState.files[id];

      if (fileInfo) {
        delete uploadState.files[id];
        await fs.unlink(`${UPLOAD_PATH}${fileInfo.fileName}`);
      }

      return fileInfo;
    });

    if (result == null) {
      return Results.notFound('File not found');
    }

    return result;
  }

  @OnError()
  onError(error: Error) {
    const message = error.message || error;
    return Results.internalServerError({ message });
  }
}

export default withController(UploadController);

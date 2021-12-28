import {
  Get,
  NextApiContext,
  Post,
  Results,
  RouteController,
  UseMiddleware,
  withController,
} from 'next-controllers';
import morgan from 'morgan';
import multer from 'multer';
import { DiskPersistence } from '../../../lib/utils/disk-persistence';

const BASE_PATH = 'uploads/images/';
const upload = multer({ dest: BASE_PATH });

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
   @UseMiddleware(upload.single('image'))
  upload({ state, request }: NextApiContext<UploadPersistence>) {
    const file = request.file;

    if (file == null) {
      throw new Error('No file to upload');
    }

    console.log(JSON.stringify(request.body, null, 2));

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
  async getPhoto({ state, request }: NextApiContext<UploadPersistence>) {
    const uploadState = await state.load();
    const id = request.params.id;

    if (id == null) {
      return Results.badRequest('No id provided');
    }

    const fileInfo = uploadState.files[id];

    if (fileInfo == null) {
      return Results.notFound('File not found');
    }

    const filePath = `${BASE_PATH}${fileInfo.fileName}`;
    return Results.file(filePath, fileInfo.mimetype);
  }
}

export default withController(UploadController);

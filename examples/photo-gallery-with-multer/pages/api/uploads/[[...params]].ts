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
import { DiskPersistence } from '../../../server/utils/disk-persistence';
import fs from 'fs/promises';
import { UPLOAD_NAME, UPLOAD_PATH, URL_PATH } from '../../../shared';
import { resizeDownAsBase64Image, upload } from '../../../server/middlewares/upload';
import { UploadState, UploadPersistence, FileInfo } from '../../../server/models/types';
import { FileDetails } from '../../../shared/types';
import { ValidationError } from '../../../server/utils/validation-error';

// 10px
const BLUR_IMAGE_SIZE = 10;

// Let multer handle the body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * A controller for file uploading.
 */
@UseMiddleware(morgan('dev'))
@RouteController({
  // Used as a local database to store the file upload information.
  state: new DiskPersistence<UploadState>('data/state.json', { lastId: 0, files: {} }),
})
class UploadController {
  /**
   * Handles a request to upload a file.
   */
  @Post('/')
  @UseMiddleware(upload.single(UPLOAD_NAME))
  upload({ state, request }: NextApiContext<UploadPersistence>) {
    const file = request.file;

    if (file == null) {
      return Results.badRequest('No file to upload');
    }

    // This is like a transation, where the changes are saved at the end
    return state.use(async (uploadState) => {
      const id = ++uploadState.lastId;

      try {
        // Convert the image to a base64 string to be used a blur image.
        const base64Image = await resizeDownAsBase64Image(file, BLUR_IMAGE_SIZE);

        // The data to store in the state
        const newFile: FileInfo = {
          id,
          fileName: file.filename,
          mimetype: file.mimetype,
          originalname: file.originalname,
          blurBase64: base64Image,
        };

        // Save the file in the state
        uploadState.files[id] = newFile;

        // Returns the newly created file info
        return newFile;
      } 
      catch (error: any) {
        // FIXME: Remove the file from the disk.
        const message = error.message || error.error || error;
        return Results.badRequest(message + '');
      }
    });
  }


  /**
   * Gets an array with all the uploaded images and their details.
   */
  @Get('/')
  async getAllImages({ state }: NextApiContext<UploadPersistence>): Promise<FileDetails[]> {
    // Loads the images
    const uploadState = await state.load();
    const files: FileDetails[] = [];

    for (const file of Object.values(uploadState.files)) {
      if (file != null) {
        const url = `${URL_PATH}${file.fileName}`;
        const blurUrl = file.blurBase64;

        files.push({
          id: file.id,
          fileName: file.originalname,
          url,
          blurUrl,
        });
      }
    }

    return files;
  }

  /**
   * Gets the image with the given `id`.
   */
  @Get('/:id')
  async getImage({ state, request }: NextApiContext<UploadPersistence>) {
    // Loads the images
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

  /**
   * Deletes the image with the given `id`.
   */
  @Delete('/:id')
  async deleteImage({ state, request }: NextApiContext<UploadPersistence>) {
    const id = request.params.id;

    if (id == null) {
      return Results.badRequest('No id provided');
    }

    const result = await state.use(async (uploadState) => {
      const fileInfo = uploadState.files[id];

      // If the file is found, delete it from the state and the disk.
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

  /**
   * Error handler for this controller.
   */
  @OnError()
  onError(error: Error) {
    const message = error.message || error;

    if (error instanceof ValidationError) {
      return Results.badRequest(message);
    }

    return Results.internalServerError(message);
  }
}

// Creates the handler with this controller
export default withController(UploadController);

import type { NextPage } from 'next';
import { FormEvent, useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { FaUpload, FaRegImages } from 'react-icons/fa';
import { fetcher } from '../client/fetcher';
import { FileDetails } from '../shared/types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Gallery } from '../components/Gallery';
import { UPLOAD_NAME } from '../shared';
import { assertTrue } from '../shared/utils';
import { Letters } from '../components/Letters';
import { FetchError } from '../client/fetch-error';

const API_URL = '/api/uploads';

const filesApi = fetcher(API_URL);

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, ...query } = useQuery(API_URL, () => filesApi<FileDetails[]>());
  const deleteFile = useMutation<FileDetails, null, FileDetails>({
    mutationFn: (f) => filesApi.delete<FileDetails>(f.id),
    onSuccess: () => queryClient.invalidateQueries(API_URL),
  });

  const uploadFile = useMutation<FileDetails, null, File>({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append(UPLOAD_NAME, file);
      return filesApi.post<FileDetails>(null, { body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(API_URL);
      handleReset();
    },
  });

  const isError = query.isError || uploadFile.isError || deleteFile.isError;
  const error = query.error || uploadFile.error || deleteFile.error;

  const handleReset = () => setFile(null);
  const handleDelete = (file: FileDetails) => deleteFile.mutate(file);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    assertTrue(file, 'File upload is not set');

    if (file) {
      uploadFile.mutate(file);
    }
  };

  return (
    <div className="container mx-auto pt-2 p-1 md:p-4 lg:p-6">
      <h1 className="flex flex-row gap-2 my-2 text-[calc(5vw+10px)] sm:text-4xl font-bold text-red-600 text-shadow-md select-none cursor-pointer">
        <FaRegImages />
        <span>
          <Letters text="Photo Gallery" letterClassName="text-red-600 hover:text-white transition-all" />
        </span>
      </h1>
      <hr className="my-3 text-white opacity-20" />
      <div className="mb-3">
        <form
          encType="multiplart/form-data"
          className="flex sm:flex-row flex-col gap-2 justify-center"
          onSubmit={handleSubmit}
        >
          <FileUpload state={{ file, setFile }} />
          {file && <UploadButton type="submit" />}
        </form>
      </div>

      {isLoading && <p className="text-white text-xl">Loading...</p>}
      {isError && <p className="text-red-600 text-xl">{errorMessage(error)}</p>}
      {data && <Gallery files={data} onDelete={handleDelete}></Gallery>}
      {data?.length === 0 && (
        <div className="h-[50vh] flex justify-center items-center content-center">
          <p className="text-white opacity-30 text-[calc(5vw+10px)] sm:text-4xl text-center select-none">
            No files uploaded yet
          </p>
        </div>
      )}
    </div>
  );
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const UploadButton: React.FC<ButtonProps> = (props) => (
  <button className="btn-rounded text-white bg-red-600 hover:bg-red-500 text-base" {...props}>
    <span className="flex flex-row gap-2 items-center justify-center">
      <span>
        <FaUpload />
      </span>
      <span>Upload</span>
    </span>
  </button>
);

function errorMessage(error: unknown): string {
  let message = '';

  if (error instanceof Error) {
    message = error.message;
  } else if ((error as any).error) {
    message = (error as any).error + '';
  }

  if (message.length > 0) {
    return 'Error: ' + message;
  } else {
    return 'Something went wrong';
  }
}

export default Home;

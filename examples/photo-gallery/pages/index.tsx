import type { NextPage } from 'next';
import { FormEvent, useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { FaUpload } from 'react-icons/fa';
import { fetcher } from '../client/fetcher';
import { FileDetails } from '../shared/types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Gallery } from '../components/Gallery';
import { UPLOAD_NAME } from '../shared';
import { assertTrue } from '../shared/utils';

const API_URL = '/api/uploads';

const filesApi = fetcher(API_URL);

const Home: NextPage = () => {
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery(API_URL, () => filesApi<FileDetails[]>());
  const deleteFile = useMutation<FileDetails, null, FileDetails>({
    useErrorBoundary: true,
    mutationFn: (f) => filesApi.delete<FileDetails>(f.id),
    onSuccess: () => queryClient.invalidateQueries(API_URL),
  });

  const uploadFile = useMutation<FileDetails, null, File>({
    useErrorBoundary: true,
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append(UPLOAD_NAME, file);
      return filesApi.post<FileDetails>(null, { body: formData });
    },
    onSuccess: () => queryClient.invalidateQueries(API_URL),
  });

  const hasMutationError = deleteFile.isError || uploadFile.isError;
  const mutationError = deleteFile.error || uploadFile.error;

  const handleFile = (file: File) => setFileUpload(file);
  const handleReset = () => setFileUpload(null);
  const handleDelete = (file: FileDetails) => deleteFile.mutate(file);
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    assertTrue(fileUpload, 'File upload is not set');

    if (fileUpload) {
      uploadFile.mutate(fileUpload);
    }
  };

  return (
    <div className="container mx-auto pt-2 p-1 md:p-4 lg:p-6">
      <div className="mb-3">
        <form
          encType="multiplart/form-data"
          className="flex sm:flex-row flex-col gap-2 justify-center"
          onSubmit={handleSubmit}
        >
          <FileUpload onFile={handleFile} onReset={handleReset} />
          {fileUpload && <UploadButton type="submit" />}
        </form>
      </div>

      {isLoading && <p className="text-white text-xl">Loading...</p>}
      {isError && <p className="text-red-500 text-xl">Error : {error}</p>}
      {hasMutationError && <p className="text-red-500 text-xl">Error : {mutationError}</p>}
      {data && <Gallery files={data} onDelete={handleDelete}></Gallery>}
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

export default Home;

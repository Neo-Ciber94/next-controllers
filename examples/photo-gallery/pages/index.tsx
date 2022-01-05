import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { FaSyncAlt, FaUpload } from 'react-icons/fa';
import { fetcher } from '../client/fetcher';
import { FileDetails } from '../shared/types';
import { useQuery } from 'react-query';
import { Gallery } from '../components/Gallery';

const API_URL = '/api/uploads';

const fetchFiles = fetcher<FileDetails[]>(API_URL);

const Home: NextPage = () => {
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const { data, isLoading, isError, error } = useQuery(API_URL, () => fetchFiles());

  const handleFile = (file: File) => setFileUpload(file);
  const handleReset = () => setFileUpload(null);

  if (data) {
    console.log(data);
  }

  return (
    <div className="container p-6">
      <form className="flex sm:flex-row flex-col gap-2 justify-center">
        <FileUpload onFile={handleFile} onReset={handleReset} />
        {fileUpload && <UploadButton type="submit" onClick={() => console.log(fileUpload)} />}
      </form>
      {isLoading && <p className="text-white text-xl">Loading...</p>}
      {isError && <p className="text-red-500 text-xl">Error : {error}</p>}
      {data && <Gallery files={data}></Gallery>}
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

import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { FaSyncAlt, FaUpload } from 'react-icons/fa';

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    setFile(file);
  };

  const handleReset = () => {
    setFile(null);
  };

  return (
    <div className="container p-6">
      <form className="flex sm:flex-row flex-col gap-2 justify-center">
        <FileUpload onFile={handleFile} onReset={handleReset} />
        {file && <UploadButton type="submit" onClick={() => console.log(file)} />}
      </form>
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

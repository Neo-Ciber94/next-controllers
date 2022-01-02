import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="container">
      <FileUpload onFile={(file) => console.log(file)} />
    </div>
  );
};

export default Home;

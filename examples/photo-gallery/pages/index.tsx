import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import styles from '../styles/Home.module.css';
import { FaSyncAlt, FaUpload } from 'react-icons/fa';

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="container">
      <form
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 3,
        }}
      >
        <FileUpload onFile={(file) => console.log(file)} />
      </form>
    </div>
  );
};

export default Home;

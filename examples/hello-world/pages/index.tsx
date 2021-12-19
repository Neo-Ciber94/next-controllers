import type { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';

const API_URL = 'http://localhost:3000/api';

const Home: NextPage = () => {
  const [name, setName] = useState<string>('');
  const url = `${API_URL}/${encodeURIComponent(name.trim())}`;
  const { data, isLoading, error, refetch, isRefetching } = useFetch<string>(url, {
    delay: 1000,
    transform: async (res) => {
      const text = await res.text();
      return decodeURIComponent(text);
    },
  });

  if (isLoading && !isRefetching) {
    return (
      <div
        className="loader"
        style={{
          width: '100%',
          height: '80%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      ></div>
    );
  }

  if (error) {
    const message = error.message || error;
    return <div style={{ color: 'red', fontSize: '2rem' }}>Error: {message}</div>;
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.text}
        style={{
          fontSize: '2rem',
          fontWeight: '700',
        }}
      >
        {data}
      </div>
      <input
        key="inpus"
        value={name}
        placeholder="What is your name?"
        onChange={(e) => {
          setName(e.target.value);
          refetch();
        }}
        style={{
          fontSize: '1.25rem',
          padding: '0.6rem',
          margin: '0.5rem 0',
          borderRadius: '0.5rem',
        }}
      />
    </div>
  );
};

export default Home;

interface FetchConfig {
  init?: RequestInit;
  transform?: (res: Response) => Promise<any>;
  delay?: number;
}

function useFetch<T = any>(url: string, config: FetchConfig = {}) {
  const [data, setData] = useState<T>();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [isRefetching, setRefetching] = useState(false);
  const [refetchCount, setRefetchCount] = useState(0);

  const transform = config.transform || ((res) => res.json());

  const refetch = () => {
    setRefetching(true);

    // Force to refetch
    setRefetchCount((count) => count + 1);
  };

  useEffect(() => {
    setLoading(true);

    fetch(url, config.init)
      .then(transform)
      .then(async (data) => {
        if (refetchCount === 0 && config.delay && config.delay > 0) {
          await delay(config.delay);
        }

        setData(data);
      })
      .catch((e) => setError(e))
      .finally(() => {
        setLoading(false);
        setRefetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchCount]);

  return { data, isLoading, error, refetch, isRefetching };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

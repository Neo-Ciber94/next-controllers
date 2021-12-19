import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

const API_URL = 'http://localhost:3000/api';

const Home: NextPage = () => {
  const [name, setName] = useState<string>('');
  const url = `${API_URL}/${encodeURIComponent(name.trim())}`;
  const { data, isLoading, error, refetch, isRefetching } = useFetch<string>(url, {
    transform: async (res) => {
      const text = await res.text();
      return decodeURIComponent(text);
    },
  });

  if (isLoading && !isRefetching) {
    return <div>Loading...</div>;
  }

  if (error) {
    const message = error.message || error;
    return <div style={{ color: 'red' }}>Error: {message}</div>;
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
}

function useFetch<T = any>(url: string, config: FetchConfig = {}) {
  const [data, setData] = useState<T>();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [isRefetching, setRefetching] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const transform = config.transform || ((res) => res.json());

  const refetch = () => {
    setRefetching(true);
    setRefresh((prev) => prev + 1);
  };

  useEffect(() => {
    setLoading(true);

    fetch(url, config.init)
      .then(transform)
      .then((data) => setData(data))
      .catch((e) => setError(e))
      .finally(() => {
        setLoading(false);
        setRefetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return { data, isLoading, error, refetch, isRefetching };
}

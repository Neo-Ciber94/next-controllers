import { Sidebar, SidebarItem } from 'components/Sidebar';
import { useFetch } from 'hooks/useFetch';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { FaUser, FaThList } from 'react-icons/fa';

const API_URL = 'http://localhost:3000/api';
const USERS_API = `${API_URL}/user`;
const POSTS_API = `${API_URL}/post`;

const Home: NextPage = () => {
  const [json, setJson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [endpoint, setEndpoint] = useState<string>(USERS_API);

  const { data, error, isLoading, isRefetching } = useFetch(endpoint, {
    delay: 1000,
    refreshTime: 3000,
  });

  useEffect(() => {
    if (data) {
      setJson(JSON.stringify(data, null, 2));
    }
  }, [data, activeTab]);

  const items: SidebarItem[] = [
    {
      title: 'Users',
      icon: FaUser,
      onClick: () => {
        setEndpoint(USERS_API);
        setActiveTab(0);
      },
    },
    {
      title: 'Posts',
      icon: FaThList,
      onClick: () => {
        setEndpoint(POSTS_API);
        setActiveTab(1);
      },
    },
  ];

  return (
    <>
      <Head>
        <title>Posts Rest API</title>
        <meta name="description" content="A sample rest api" />
        <script src="https://kit.fontawesome.com/78d19f8d06.js" crossOrigin="anonymous" async></script>
      </Head>

      <div>
        <Sidebar title="Endpoints" items={items} active={activeTab}></Sidebar>
        <main>
          <h1 style={{ cursor: 'pointer', fontSize: 'calc(0.5vw + 20px)' }}>Posts Rest API</h1>
          <div style={{ height: 2, width: '100%', backgroundColor: 'white' }}></div>

          <div id="content">
            <JsonFetchResult isLoading={isLoading} isRefetching={isRefetching} error={error} json={json} />
          </div>
        </main>
      </div>
    </>
  );
};

interface JsonFetchResultProps {
  isLoading: boolean;
  isRefetching: boolean;
  error?: any;
  json: string | null;
}

const JsonFetchResult = (props: JsonFetchResultProps) => {
  const { isLoading, isRefetching, error, json } = props;

  if (isLoading && !isRefetching) {
    return <div className="loading">Loading...</div>;
  }

  if (error != null) {
    return <div className="error">Error: {error.message || error.error || error}</div>;
  }

  return <pre>{json || ''}</pre>;
};

export default Home;

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

const Layout = ({ children }: { children: React.ReactNode }) => <div className="rainbow-bg">{children}</div>;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Head>
        <title>Hello World!</title>
      </Head>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;

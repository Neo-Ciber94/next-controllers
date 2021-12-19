import '../styles/globals.css';
import type { AppProps } from 'next/app';

const Layout = ({ children }: { children: React.ReactNode }) => <div className="rainbow-bg">{children}</div>;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;

import { FetchError } from './fetch-error';

export type QueryParams = {
  [key: string]: string | number | boolean;
};

export type Params = number | string | QueryParams;

export type FetcherFn = <T>(params?: Params | null, requestConfig?: RequestInit) => Promise<T>;

export type FetcherConfig = Omit<RequestInit, 'method'>;

export interface Fetcher {
  <T>(params?: Params | null, requestConfig?: RequestInit): Promise<T>;
  get<T>(params?: Params | null, requestConfig?: FetcherConfig): Promise<T>;
  post<T>(params?: Params | null, requestConfig?: FetcherConfig): Promise<T>;
  put<T>(params?: Params | null, requestConfig?: FetcherConfig): Promise<T>;
  patch<T>(params?: Params | null, requestConfig?: FetcherConfig): Promise<T>;
  delete<T>(params?: Params | null, requestConfig?: FetcherConfig): Promise<T>;
}

export function fetcher(url: string, initialConfig?: RequestInit): Fetcher {
  if (url.endsWith('/') || url.endsWith('?')) {
    url = url.slice(0, -1);
  }

  const fn: FetcherFn = (params?: Params | null, requestConfig?: RequestInit) => {
    if (params) {
      switch (typeof params) {
        case 'number':
        case 'string':
          url += `/${params}`;
          break;
        case 'object':
          {
            const queryParams = Object.entries(params)
              .map(([key, value]) => `${key}=${value}`)
              .join('&');
              url += `?${queryParams}`;
          }
          break;
        default:
          throw new Error(`Invalid params: ${params}`);
      }
    }

    const config = { ...initialConfig, ...requestConfig };
    return fetchJson(url, config);
  };

  return createFetcher(fn);
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new FetchError(res);
  }

  return await res.json();
}

function createFetcher(fn: FetcherFn): Fetcher {
  const obj: Fetcher = (params, config) => fn(params, config);
  obj.get = (params, config) => fn(params, { ...config, method: 'GET' });
  obj.post = (params, config) => fn(params, { ...config, method: 'POST' });
  obj.put = (params, config) => fn(params, { ...config, method: 'PUT' });
  obj.patch = (params, config) => fn(params, { ...config, method: 'PATCH' });
  obj.delete = (params, config) => fn(params, { ...config, method: 'DELETE' });
  return obj;
}
export type QueryParams = {
  [key: string]: string | number | boolean;
};

export type Params = number | string | QueryParams;

export type Fetcher<T> = (params?: Params) => Promise<T>;

export function fetcher<T>(url: string, init?: RequestInit): Fetcher<T> {
  if (url.endsWith('/') || url.endsWith('?')) {
    url = url.slice(0, -1);
  }

  return (params?: Params) => {
    let fullUrl = getBaseUrl() + url;

    if (params) {
      switch (typeof params) {
        case 'number':
        case 'string':
          fullUrl += `/${params}`;
          break;
        case 'object':
          {
            const queryParams = Object.entries(params)
              .map(([key, value]) => `${key}=${value}`)
              .join('&');
            fullUrl += `?${queryParams}`;
          }
          break;
        default:
          throw new Error(`Invalid params: ${params}`);
      }
    }

    return fetchJson<T>(fullUrl, init);
  };
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  return await fetch(url, init).then((res) => res.json());
}

function getBaseUrl(): string {
  let baseUrl = process.env.FETCHER_BASE_URL || '';

  if (baseUrl && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return baseUrl;
}

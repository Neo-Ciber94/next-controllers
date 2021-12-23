import { fetchJson, toPascalCase } from 'lib/utils';
import { NextApiResponse } from 'next';
import { Middleware, NextApiRequestWithParams } from 'next-controllers';

export interface Geolocation {
  query: string;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export type GeolocationOptions = {
  [P in keyof Geolocation]?: boolean;
};

// Returns a function that attach geolocation data using 'http://ip-api.com/json' service
export function geolocation(
  options: GeolocationOptions = { country: true, countryCode: true },
): Middleware<NextApiRequestWithParams, NextApiResponse> {
  return async (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Check if the ip is the local ip address
    ip = ip === '::1' ? '' : ip;

    // if (ip != null) {
    //   const result = await fetchJson<Geolocation>(`http://ip-api.com/json/${ip}`);

    //   for (const [key, value] of Object.entries(options)) {
    //     if (value === true) {
    //       const headerKey = toPascalCase(key);
    //       const headerValue = result[key as keyof Geolocation];
    //       res.setHeader(headerKey, headerValue);
    //     }
    //   }
    // }

    next();
  };
}

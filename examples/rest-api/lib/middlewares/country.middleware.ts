import { fetchJson } from 'lib/utils';
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

// Returns a function that attach country to the header using 'http://ip-api.com/json' service
export function country(): Middleware<NextApiRequestWithParams, NextApiResponse> {
  return async (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Check if the ip is the local ip address
    ip = ip === '::1' ? '' : ip;

    if (ip != null) {
      const result = await fetchJson<Geolocation>(`http://ip-api.com/json/${ip}`);
      res.setHeader('Country', result.country);
      res.setHeader('CountryCode', result.countryCode);
    }

    next();
  };
}

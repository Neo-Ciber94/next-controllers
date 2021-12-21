import { NextApiResponse } from 'next';
import { Middleware, NextApiRequestWithParams } from 'next-controllers';

// Returns a function that attach country to the header using 'http://ip-api.com/json' service
export function country(): Middleware<NextApiRequestWithParams, NextApiResponse> {
  return async (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Check if the ip is the local ip address
    ip = ip === '::1' ? '' : ip;

    if (ip != null) {
      const url = `http://ip-api.com/json`;
      const result = await fetch(url).then((res) => res.json());
      res.setHeader('X-Country', result.country);
      res.setHeader('X-CountryCode', result.countryCode);
    }

    next();
  };
}

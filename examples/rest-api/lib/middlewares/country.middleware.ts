import { NextApiResponse } from 'next';
import { Middleware, NextApiRequestWithParams } from 'next-controllers';

let count = 0;

// Returns a function that attach country to the header using 'http://ip-api.com/json' service
export function country(): Middleware<NextApiRequestWithParams, NextApiResponse> {
  return async (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    res.setHeader('X-Number', ++count);
    res.setHeader('X-Double', count * 2);

    // Check if the ip is the local ip address
    ip = ip === '::1' ? '' : ip;

    const url = `http://ip-api.com/json`;
    const result = await fetch(url).then((res) => res.json());

    // FIXME: Headers are not being sent due to a bug in next-controllers
    res.setHeader('X-Country', result.country);
    res.setHeader('X-CountryCode', result.countryCode);
    console.log(`Fetching country from ${url}`);

    next();
  };
}

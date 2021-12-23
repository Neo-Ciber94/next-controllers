import morgan from 'morgan';
import cors from 'cors';
import { geolocation } from './geolocation.middleware';
import { MiddlewareHandler } from 'next-controllers';

// Colletion of common middlewares
const common: MiddlewareHandler<any, any>[] = [cors(), morgan('dev'), geolocation()];

export default common;

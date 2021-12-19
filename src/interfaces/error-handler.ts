import { NextApiRequest } from 'next';
import { HttpContext, NextApiRequestWithParams } from 'src';

export interface OnErrorHandler<
  TState = any,
  Req extends NextApiRequest = NextApiRequest,
  Res extends NextApiRequestWithParams = NextApiRequestWithParams,
> {
  onError(error: any, context: HttpContext<TState, Req, Res>): Promise<any> | any;
}

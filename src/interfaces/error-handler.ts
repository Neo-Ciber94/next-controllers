import { NextApiResponse } from 'next';
import { HttpContext, NextApiRequestWithParams } from 'src';

export interface ErrorHandlerInterface<
  TState = any,
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
> {
  onError(error: any, context: HttpContext<TState, Req, Res>): Promise<any> | any;
}

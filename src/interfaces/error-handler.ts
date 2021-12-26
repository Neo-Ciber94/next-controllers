import { NextApiResponse } from 'next';
import { NextApiContext, NextApiRequestWithParams } from 'src';

export interface ErrorHandlerInterface<
  TState = any,
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
> {
  onError(error: any, context: NextApiContext<TState, Req, Res>): Promise<any> | any;
}

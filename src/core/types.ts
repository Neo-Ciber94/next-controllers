import { NextApiRequest, NextApiResponse } from "next";
import { HttpContext } from "..";

/**
 * Specialization of `HttpContext` type for NextJS.
 */
export type NextApiContext<
  TState = any,
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse
> = HttpContext<TState, Req, Res>;

/**
 * Represents an object type that can be instantiate.
 */
export type ObjectType<T> = Function & { new (...args: any[]): T };

/**
 * Represents a route handler.
 */
export type Handler<Req, Res> = (
  context: HttpContext<any, Req, Res>
) => Promise<any> | any;

/**
 * A handler for call the next action.
 */
export type NextHandler = (err?: any) => void;

/**
 * A handler for the errors.
 */
export type ErrorHandler<Req, Res> = (
  err: any,
  context: HttpContext<any, Req, Res>,
  next: NextHandler
) => Promise<any> | any;

/**
 * A handler for middlewares.
 */
export type Middleware<Req, Res> = (
  req: Req,
  res: Res,
  next: NextHandler
) => Promise<any> | any;

/**
 * Params object.
 */
export type Params = {
  [key: string]: string | undefined;
};

/**
 * Represents the request object with the params.
 */
export type NextApiRequestWithParams = NextApiRequest & {
  params: Params;
};

/**
 * Represents anything that resolves into a value of type `T`.
 */
export type ValueOrPromise<T> = T | Promise<T> | (() => T | Promise<T>);

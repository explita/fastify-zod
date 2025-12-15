import type {
  FastifyRequest,
  RouteGenericInterface,
  RouteHandlerMethod,
} from "fastify";
import type z from "zod";

/**
 * A function that can be used to run custom validation checks on a Fastify request.
 * The function receives the Fastify request and an object with a single property, `multiPathError`, which can be used to set errors on multiple paths at once.
 * The function should return an object with the errors, or a promise that resolves to an object with the errors.
 * If the function does not return anything, or returns a promise that resolves to undefined, it is assumed that no errors were found.
 * @param req The Fastify request
 * @param ctx An object with a single property, `multiPathError`, which can be used to set errors on multiple paths at once.
 * @returns An object with the errors, or a promise that resolves to an object with the errors.
 */
export type CheckFn<Req extends RouteGenericInterface = RouteGenericInterface> =
  (
    req: FastifyRequest<Req>,
    ctx: {
      multiPathError: (
        paths: Path<Req["Body"]>[] | string[],
        message: string
      ) => Partial<Record<Path<Req["Body"]>, string>>;
    }
  ) => Record<string, any> | void | Promise<Record<string, any> | void>;

/**
 * Options for the Fastify-Zod plugin
 * @property {boolean} [verbose=false] - Console log the process
 * @property {string} [hint] - Error message to be sent to the client
 * @property {"simple" | "detailed" | "flat"} [format="simple"] - Format for error responses
 * @property {(issues: z.core.$ZodIssue[]) => Record<string, any>} [formatter] - Custom formatter for error responses
 * @property {boolean} [soft=false] - Soft validation, don't throw an error if validation fails
 */
export interface PluginOptions {
  /**
   * Whether to log the validation process.
   */
  verbose?: boolean;
  /**
   * Error message to be sent to the client
   */
  hint?: string;
  /**
   * Format for error responses
   */
  format?: "simple" | "detailed" | "flat";
  /**
   * Custom formatter for error responses
   * @param {z.core.$ZodIssue[]} issues - The Zod validation errors
   * @returns {Record<string, any>} - The formatted error response
   */
  formatter?: (issues: z.core.$ZodIssue[]) => Record<string, any>;
  /**
   * If true, the plugin will not throw an error if the provided schema is not a valid Zod schema.
   */
  soft?: boolean;
}

/**
 * Configuration object for the Fastify-Zod plugin.
 * Contains the Zod schemas for the request body, parameters and query string.
 * If a schema is not provided, the corresponding part of the request will not be validated.
 */
export interface SchemaConfig {
  /**
   * The Zod schema for the request body.
   * If not provided, the request body will not be validated.
   *
   * @example
   * const schema = z.object({
   *   name: z.string(),
   *   age: z.number().int(),
   * });
   */
  body?: z.ZodTypeAny;
  /**
   * The Zod schema for the request parameters.
   * If not provided, the request parameters will not be validated.
   *
   * @example
   * const schema = z.object({
   *   id: z.string().uuid(),
   * });
   */
  params?: z.ZodTypeAny;
  /**
   * The Zod schema for the request query string.
   * If not provided, the request query string will not be validated.
   *
   * @example
   * const schema = z.object({
   *   search: z.string(),
   *   page: z.number().int().min(1).optional(),
   * });
   */
  query?: z.ZodTypeAny;
}

type InferSchema<T> = T extends z.ZodTypeAny ? z.infer<T> : any;

export type InferConfig<C extends SchemaConfig> = {
  Body: InferSchema<C["body"]>;
  Params: InferSchema<C["params"]>;
  Querystring: InferSchema<C["query"]>;
};

export type Handler<C extends SchemaConfig> = RouteHandlerMethod<
  any,
  any,
  any,
  InferConfig<C>
>;

type PreHandler<C extends SchemaConfig> = Handler<C>;

type HandlerMethod<C extends SchemaConfig> = Omit<
  ZodRouteBuilder<C>,
  "check" | "pre"
>;

export interface ZodRouteBuilder<C extends SchemaConfig> {
  check(
    fn: CheckFn<InferConfig<C>> | CheckFn<InferConfig<C>>[]
  ): Omit<ZodRouteBuilder<C>, "pre">;

  pre(fn: PreHandler<C>): ZodRouteBuilder<C>;

  post(url: string, handler: Handler<C>): HandlerMethod<C>;
  put(url: string, handler: Handler<C>): HandlerMethod<C>;
  get(url: string, handler: Handler<C>): HandlerMethod<C>;
  patch(url: string, handler: Handler<C>): HandlerMethod<C>;
  delete(url: string, handler: Handler<C>): HandlerMethod<C>;
}

// Extend Fastify's RouteOptions to include our validation options
declare module "fastify" {
  //@ts-ignore
  interface RouteShorthandOptions<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface
  > {
    validation?: {
      /**
       * Custom validation checks to be run on the request.
       */
      check?: CheckFn<RouteGeneric> | CheckFn<RouteGeneric>[];
      /**
       * Object containing optional schemas for request body, query and parameters.
       */
      schema?: SchemaConfig;
    };
  }

  interface FastifyInstance {
    schema: <C extends SchemaConfig>(config?: C) => ZodRouteBuilder<C>;
  }
}

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

type PathImpl<T, D extends number = 5> = D extends 0
  ? never
  : T extends object
  ? {
      [K in Extract<keyof T, string>]: T[K] extends Array<infer U>
        ?
            | `${K}`
            | `${K}[${number}]`
            | (D extends 1
                ? never
                : `${K}[${number}]${DotPrefix<PathImpl<U, Prev[D]>>}`)
        :
            | `${K}`
            | (D extends 1
                ? never
                : `${K}${DotPrefix<PathImpl<T[K], Prev[D]>>}`);
    }[Extract<keyof T, string>]
  : "";

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type Path<T> = PathImpl<T>;

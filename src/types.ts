import type { FastifyRequest, RouteGenericInterface } from "fastify";
import type z from "zod";

export type CheckFn<Req extends RouteGenericInterface = RouteGenericInterface> =
  (
    req: FastifyRequest<Req>,
    ctx: {
      multiPathError: (
        paths: Path<Req["Body"]>[],
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

export interface ZodSchemaConfig {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
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
      schema?: ZodSchemaConfig;
    };
  }
}

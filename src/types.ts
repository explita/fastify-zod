import type z from "zod";

export interface PluginOptions {
  /**
   * Console log the process
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
}

export interface ZodSchemaConfig {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
}

// Extend Fastify's RouteOptions to include our zodSchema
declare module "fastify" {
  //@ts-ignore
  interface RouteShorthandOptions {
    zodSchema?: ZodSchemaConfig;
  }
}

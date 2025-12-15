import type { FastifyInstance } from "fastify";
import type { CheckFn, SchemaConfig, InferConfig, Handler } from "../types.js";
import { runChecks } from "./check.js";
import { schemaValidation } from "./schema-validation.js";
import { logRouteInfo } from "../lib/logger.js";

export function defineRoute<C extends SchemaConfig>(
  fastify: FastifyInstance,
  schema?: C
) {
  const checks: CheckFn<InferConfig<any>>[] = [];
  const preHandlers: Function[] = [];

  const make = (method: string) => {
    return (url: string, handler: Handler<C>) => {
      fastify.route<InferConfig<any>>({
        method,
        url,
        preHandler: async (req, rep) => {
          const start = performance.now();

          //@ts-ignore
          const { config, ...schemaObj } = schema;

          // attach hint
          //@ts-ignore
          req.hint = config?.hint;

          // run real preHandlers first
          for (const pre of preHandlers) {
            if (typeof pre !== "function") continue;
            await pre(req, rep);
          }

          schemaValidation(req, rep, schemaObj, config);

          // then run checks returning error objects
          runChecks(req, rep, checks);

          const end = performance.now();

          //@ts-ignore
          if (config.verbose && (schema || checks)) {
            logRouteInfo(req, {
              schema,
              checks,
              duration: end - start,
            });
          }
        },
        handler,
      });

      return builder as Omit<typeof builder, "check" | "pre">;
    };
  };

  const builder = {
    check(fn: CheckFn<InferConfig<C>> | CheckFn<InferConfig<C>>[]) {
      const fns = Array.isArray(fn) ? fn : [fn];
      checks.push(...fns);
      return builder as Omit<typeof builder, "pre">;
    },

    pre(fn: Function) {
      preHandlers.push(fn);
      return builder;
    },
    post: make("POST"),
    get: make("GET"),
    put: make("PUT"),
    patch: make("PATCH"),
    delete: make("DELETE"),
  };

  return builder;
}

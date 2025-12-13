import type { FastifyInstance } from "fastify";
import type { CheckFn, SchemaConfig, InferConfig, Handler } from "../types.js";
import { runChecks } from "./check.js";

export function defineRoute<C extends SchemaConfig>(
  fastify: FastifyInstance,
  config?: C
) {
  const checks: CheckFn<InferConfig<any>>[] = [];

  const make = (method: string) => {
    //@ts-ignore
    return (url: string, handler: Handler<C>) => {
      fastify.route<InferConfig<any>>({
        method,
        url,
        validation: {
          schema: {
            body: config?.body,
            params: config?.params,
            query: config?.query,
          },
        },
        preHandler: (req, rep) => {
          //@ts-ignore
          req.hint = config?.hint;
          return runChecks(req, rep, checks);
        },
        handler,
      });

      return builder as Omit<typeof builder, "check">;
    };
  };

  const builder = {
    //@ts-ignore
    check(fn: CheckFn<InferConfig<C>> | CheckFn<InferConfig<C>>[]) {
      const fns = Array.isArray(fn) ? fn : [fn];
      checks.push(...fns);
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

import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { isZodError, formatErrors } from "../lib/utils.js";
import type {
  CheckFn,
  InferConfig,
  PluginOptions,
  SchemaConfig,
} from "../types.js";
import { check } from "./check.js";
import { logRouteInfo } from "../lib/logger.js";
import { defineRoute } from "./define-route.js";
import { schemaValidation } from "./schema-validation.js";

export const fastifyZod = fp(
  function (fastify: FastifyInstance, opts: PluginOptions, done) {
    const {
      hint = "Invalid data submitted",
      format = "flat",
      verbose = true,
      formatter,
      soft = false,
    } = opts;

    const config = { hint, format, verbose, formatter, soft };

    // Hook to capture route schemas
    fastify.addHook("onRoute", (routeOptions) => {
      if (!routeOptions.config) routeOptions.config = {};

      if (routeOptions.validation?.schema) {
        //@ts-ignore
        routeOptions.config._zodSchema = routeOptions.validation.schema;
      }

      const routeChecks = routeOptions.validation?.check;
      if (routeChecks) {
        //@ts-ignore
        routeOptions.config._routeChecks = routeChecks;
      }
    });

    // Hook to validate requests
    fastify.addHook("preHandler", async (request, reply) => {
      const start = performance.now();

      //@ts-ignore
      const schema = request.routeOptions.config._zodSchema;

      await schemaValidation(request, reply, schema, config);
      if (reply.sent) return;

      //@ts-ignore
      const routeChecks = request.routeOptions.config?._routeChecks;
      if (routeChecks) {
        const errors = await check(request, routeChecks);

        if (Object.keys(errors).length > 0) {
          return reply
            .status(400)
            .send({ statusCode: 400, message: hint, ...errors });
        }
      }

      const end = performance.now();

      if (verbose && (schema || routeChecks)) {
        logRouteInfo(request, {
          schema,
          checks: routeChecks,
          duration: end - start,
        });
      }
    });

    //@ts-ignore
    fastify.decorate("schema", function (schema?: SchemaConfig) {
      return defineRoute(this, { ...schema, config });
    });

    done();
  },
  { name: "@explita/fastify-zod", fastify: "^5" }
);

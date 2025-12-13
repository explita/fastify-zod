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

export const fastifyZod = fp(
  function (fastify: FastifyInstance, opts: PluginOptions, done) {
    const {
      hint = "Invalid data submitted",
      format = "flat",
      verbose = true,
      formatter,
      soft = false,
    } = opts;

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
      const requestId = request.id;
      const method = request.method;
      const url = request.url;

      //@ts-ignore
      const schema = request.routeOptions.config._zodSchema;

      if (schema) {
        if (verbose) {
          console.info("Validating request", { requestId, method, url });
        }

        try {
          if (schema.body) {
            if (typeof schema.body.parse !== "function") {
              if (soft) return;
              throw new Error("schema.body is not a valid Zod schema");
            }
            request.body = await schema.body.parseAsync(request.body);
          }
          if (schema.query) {
            if (typeof schema.query.parse !== "function") {
              if (soft) return;
              throw new Error("schema.query is not a valid Zod schema");
            }
            request.query = await schema.query.parseAsync(request.query);
          }
          if (schema.params) {
            if (typeof schema.params.parse !== "function") {
              if (soft) return;
              throw new Error("schema.params is not a valid Zod schema");
            }
            request.params = await schema.params.parseAsync(request.params);
          }
        } catch (error) {
          if (verbose) {
            console.error("Validation failed", {
              requestId,
              error,
              // validationError: isZodError(error) ? error.issues : undefined,
            });
          }

          if (isZodError(error)) {
            return reply.status(400).send({
              requestId,
              success: false,
              message: hint,
              errors: formatter
                ? formatter(error.issues)
                : formatErrors(error.issues, format),
              timestamp: new Date().toISOString(),
            });
          }
          throw error;
        }
      }

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
        logRouteInfo({
          requestId,
          method,
          url,
          schema,
          checks: routeChecks,
          duration: end - start,
        });
      }
    });

    //@ts-ignore
    fastify.decorate("schema", function (config?: SchemaConfig) {
      return defineRoute(this, { ...config, hint });
    });

    done();
  },
  { name: "@explita/fastify-zod", fastify: "^5" }
);

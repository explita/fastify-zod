import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isZodError, formatErrors } from "../lib/utils.js";
import type { PluginOptions, ZodSchemaConfig } from "../types.js";

export const fastifyZod = fp(
  async function (fastify: FastifyInstance, opts: PluginOptions) {
    const {
      hint = "Invalid data submitted",
      format = "flat",
      verbose = true,
    } = opts;

    // Store schemas by route
    const routeSchemas = new Map<string, ZodSchemaConfig>();

    // Hook to capture route schemas
    fastify.addHook("onRoute", (routeOptions) => {
      if (routeOptions.zodSchema) {
        const method = Array.isArray(routeOptions.method)
          ? routeOptions.method[0]
          : routeOptions.method;
        const path = routeOptions.url;

        routeSchemas.set(`${method}:${path}`, routeOptions.zodSchema);
      }
    });

    // Hook to validate requests
    fastify.addHook(
      "preValidation",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const requestId = request.id;
        const method = request.method;
        const url = request.url;

        const schema = routeSchemas.get(`${method}:${url}`);

        if (!schema) return;

        if (verbose) {
          console.info("Validating request", { requestId, method, url });
        }

        try {
          if (schema.body) {
            request.body = await schema.body.parseAsync(request.body);
          }
          if (schema.query) {
            request.query = await schema.query.parseAsync(request.query);
          }
          if (schema.params) {
            request.params = await schema.params.parseAsync(request.params);
          }
        } catch (error) {
          if (verbose) {
            console.error("Validation failed", {
              requestId,
              error,
              validationError: isZodError(error) ? error.issues : undefined,
            });
          }

          if (isZodError(error)) {
            return reply.status(400).send({
              requestId,
              success: false,
              message: hint,
              errors: formatErrors(error.issues, format),
              timestamp: new Date().toISOString(),
            });
          }
          throw error;
        }
      }
    );
  },
  { name: "@explita/fastify-zod", fastify: "^5" }
);

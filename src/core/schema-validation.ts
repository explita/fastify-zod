import type { FastifyReply, FastifyRequest } from "fastify";
import { formatErrors, isZodError } from "../lib/utils.js";
import type { PluginOptions, SchemaConfig } from "../types.js";

export async function schemaValidation(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: SchemaConfig | undefined,
  config: PluginOptions
) {
  if (schema && Object.keys(schema).length > 0) {
    const { hint, format, verbose, formatter, soft } = config;

    if (verbose) {
      console.info("Validating request", {
        requestId: request.id,
        method: request.method,
        url: request.url,
      });
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

      return false;
    } catch (error) {
      if (verbose) {
        console.error("Validation failed", {
          requestId: request.id,
          error,
          // validationError: isZodError(error) ? error.issues : undefined,
        });
      }

      if (isZodError(error)) {
        reply.status(400).send({
          requestId: request.id,
          success: false,
          message: hint,
          errors: formatter
            ? formatter(error.issues)
            : formatErrors(error.issues, format),
          timestamp: new Date().toISOString(),
        });

        return true;
      }
      throw error;
    }
  }

  return false;
}

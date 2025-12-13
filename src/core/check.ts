import type {
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
} from "fastify";
import type { CheckFn, InferConfig } from "../types.js";
import { multiPathError } from "../lib/utils.js";

// 💡 Core checker
export async function check<Req extends RouteGenericInterface>(
  req: FastifyRequest,
  checks: CheckFn<Req> | CheckFn<Req>[]
) {
  const errorsObject: Record<string, string | Record<string, string>> = {};

  for (const check of Array.isArray(checks) ? checks : [checks]) {
    if (typeof check !== "function") continue;

    //@ts-ignore
    const result = await check(req, {
      multiPathError,
    });

    if (result) {
      Object.entries(result).forEach(([k, v]) => {
        if (k.startsWith("_")) {
          errorsObject[k.replace("_", "")] = v;
        } else {
          if (!errorsObject.errors) {
            errorsObject.errors = {};
          }
          //@ts-ignore
          errorsObject.errors[k] = v;
        }
      });
    }
  }

  return errorsObject;
}

export async function runChecks(
  req: FastifyRequest,
  reply: FastifyReply,
  currentChecks: CheckFn<InferConfig<any>>[]
) {
  const errors = await check(req, currentChecks);

  if (errors && Object.keys(errors).length) {
    return (
      reply
        .status(400)
        //@ts-ignore
        .send({ statusCode: 400, message: req.hint, ...errors })
    );
  }
}

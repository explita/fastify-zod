import type { FastifyRequest } from "fastify";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",

  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[90m",
};

function checkmark(ok: boolean) {
  return ok
    ? `${COLORS.green}✓${COLORS.reset}`
    : `${COLORS.yellow}—${COLORS.reset}`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function logRouteInfo(
  req: FastifyRequest,
  {
    schema,
    checks,
    duration,
  }: {
    schema: any;
    checks?: any[];
    duration: number;
  }
) {
  const { id, method, url } = req;
  const body = checkmark(!!schema?.body);
  const params = checkmark(!!schema?.params);
  const query = checkmark(!!schema?.query);

  const checkCount = checks?.length ?? 0;

  console.group(
    `${COLORS.blue}[fastify-zod]${COLORS.reset}  🔍  ${COLORS.cyan}${method} ${url}${COLORS.reset}  ` +
      `${COLORS.dim}(req: ${id})${COLORS.reset}`
  );

  console.log(
    `${COLORS.dim}schema     ${COLORS.reset} |  body ${body}   params ${params}   query ${query}`
  );

  console.log(
    `${COLORS.dim}check       ${COLORS.reset} |  ${plural(checkCount, "check")}`
  );

  console.log(
    `${COLORS.dim}validated   ${COLORS.reset} |  ${duration.toFixed(2)}ms`
  );

  console.groupEnd();
}

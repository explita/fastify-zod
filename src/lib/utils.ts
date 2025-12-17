import type z from "zod";
import type { Path } from "../types.js";

export function multiPathError<T>(paths: Path<T>[], message: string) {
  return paths.reduce((acc, path) => {
    acc[path] = message;
    return acc;
  }, {} as Partial<Record<Path<T>, string>>);
}

export function formatErrors(
  issues: z.ZodError["issues"],
  format: "simple" | "detailed" | "flat" = "simple"
): Record<string, any> {
  if (!issues) return {};

  if (format === "flat") {
    return issues.reduce((acc, issue) => {
      const path = issue.path.join(".") || "_root";
      return { ...acc, [path]: issue.message };
    }, {});
  }

  if (format === "detailed") {
    return issues;
  }

  // Default simple format
  return issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "_root";
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(issue.message);
    return acc;
  }, {} as Record<string, string[]>);
}

export function isZodError(error: any): error is z.ZodError {
  const issues = error.issues;
  return (
    issues &&
    typeof issues === "object" &&
    Array.isArray(issues) &&
    issues.every((i: any) => "path" in i && "message" in i)
  );
}

export function reject(message: Record<string, string> | string) {
  if (typeof message === "string") {
    return { _message: message };
  }
  return message;
}

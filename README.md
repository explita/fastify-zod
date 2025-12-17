# Fastify Zod

A Fastify plugin that provides seamless integration with [Zod](https://zod.dev/) for request validation with custom check functions. This plugin allows you to validate request body, query parameters, and route parameters using Zod schemas with minimal setup.

## Features

- 🚀 **Seamless Integration**: Works with Fastify v5+
- 🔍 **Comprehensive Validation**: Validate request body, query, and route parameters
- 🛡️ **Custom Validation**: Add custom validation logic with check functions
- ⚡ **Async Support**: Built-in support for async validation
- 📦 **Type Safety**: Full TypeScript support with proper type inference
- 🔄 **Flexible Error Formatting**: Multiple error formatting options
- � **Path-based Errors**: Support for nested object validation errors

#

## Installation

```bash
npm install @explita/fastify-zod zod fastify-plugin
# or
yarn add @explita/fastify-zod zod fastify-plugin
# or
pnpm add @explita/fastify-zod zod fastify-plugin
```

#

## Quick Start

```typescript
import Fastify from "fastify";
import { z } from "zod";
import { fastifyZod } from "@explita/fastify-zod";

const app = Fastify();

// Register the plugin
await app.register(fastifyZod, {
  hint: "Validation failed", // Custom error message
  format: "flat", // Error format: 'flat' | 'detailed' | 'simple'
  verbose: true, // Enable/disable logging
  soft: true, // Don't throw on invalid schema
  formatter: undefined, // Custom error formatter function
});

// Define your route with validation
app.get(
  "/users/:id",
  {
    validation: {
      // Zod schemas for validation
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        query: z.object({
          page: z.string().optional().default("1"),
        }),
      },
      // Custom validation checks
      check: async (req, { multiPathError }) => {
        if (req.query.page === "0") {
          return multiPathError(["page"], "Page must be greater than 0");
        }
      },
    },
  },
  async (request) => {
    // Request is already validated at this point
    return { userId: request.params.id, page: request.query.page };
  }
);

// Start the server
app.listen({ port: 3000 });
```

#

### Plugin Options

| Option      | Type                               | Default                    | Description                                  |
| ----------- | ---------------------------------- | -------------------------- | -------------------------------------------- |
| `hint`      | `string`                           | `'Invalid data submitted'` | Custom error message for validation failures |
| `format`    | `'flat' \| 'detailed' \| 'simple'` | `'simple'`                 | Error format style                           |
| `verbose`   | `boolean`                          | `false`                    | Enable/disable request validation logging    |
| `soft`      | `boolean`                          | `false`                    | Don't throw on invalid schema                |
| `formatter` | `(issues: ZodIssue[]) => any`      | `undefined`                | Custom error formatter function              |

#

## Chaining API

The plugin provides a fluent chaining API for defining routes with validation:

```typescript
import { fastifyZod } from "@explita/fastify-zod";
import { z } from "zod";

// Register the plugin
await app.register(fastifyZod);

// Using the chaining API
app
  .schema({
    body: z.object({
      name: z.string(),
      age: z.number().int().positive(),
    }),
  })
  .pre(async (req) => {
    // Runs before validation and checks
    // Good for permission / authorization checks
    console.log("Running pre-handler for:", req.url);
    // You can modify the request object here if needed
  })
  .pre((req) => {
    // You can chain multiple pre handlers
    console.log("Running pre-handler for:", req.url);
  })
  // check can take single or array of check functions
  // or chain multiple checks
  .check([
    (req, { multiPathError }) => {
      if (req.body.age < 18) {
        return multiPathError(["age"], "Must be at least 18 years old");
      }
    },
    // You can add more validation functions
    (req) => {
      if (req.body.name === "admin") {
        return { name: "Admin username is not allowed" };
      }
    },
  ])
  .post("/users", async (req) => {
    // req.body is properly typed
    return { message: `Hello ${req.body.name}!` };
  });

// You can also chain multiple HTTP methods
app
  .schema({
    params: z.object({
      id: z.string().uuid(),
    }),
  })
  .get("/users/:id", async (req) => {
    // req.params.id is properly typed as string
    return { userId: req.params.id };
  })
  .delete("/users/:id", async (req) => {
    // Same schema is reused for all methods
    return { deleted: req.params.id };
  });

// Method 2: Using defineRoute - pass fastify instance
const routes = defineRoute(fastify, {
  body: z.object({
    name: z.string(),
    age: z.number().int().positive(),
  }),
})
  .pre(async (req) => {
    // Pre-handler for all routes using this builder
    console.log("Route pre-handler running");
  })
  .check((req, { multiPathError }) => {
    // Custom validation
  });

// Then use routes with HTTP methods
routes.get("/users", async (req) => {
  // req.body is properly typed
  return { message: `Hello ${req.body.name}!` };
});

//Or create the instance of the route
const routes = defineRoute(fastify, {
  body: z.object({
    name: z.string(),
    age: z.number().int().positive(),
  }),
})

// then use it with pre(s) and check(s)
routes
.pre(...)
.pre(...)
.check(...)
.check(...)
.post("/users", async (req) => {
  // req.body is properly typed
  return { message: `Hello ${req.body.name}!` };
})

// For routes without validation, native fastify methods should be used
app.get("/health", () => ({ status: "ok" }));
```

### Chaining Order

When using the chaining API, methods should be called in this specific order:

1. `.schema(config)` - Define your schemas (optional)
2. `.pre(handler)` - Add pre-handler (optional, must be before `.check()`)
3. `.check(fn)` - Add validation checks (optional)
4. HTTP method (`.get()`, `.post()`, etc.) - Define route handler

> **Note**: `.pre()` must be called before any `.check()` or HTTP method calls. Once you call an HTTP method, you can't add more checks or pre-handlers to that route.

The chaining API supports all HTTP methods: `get`, `post`, `put`, `patch`, and `delete`. Each method call returns the same builder instance, allowing you to chain multiple routes with the same validation rules.

## Validation Options

Each route can define validation options:

```typescript
app.post(
  "/users",
  {
    validation: {
      // Required: Zod schemas for validation
      schema: {
        body: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
      },
      // Optional: Custom validation checks
      check: [
        async (req) => {
          if (req.body.name === "admin") {
            return { name: "Admin username is reserved" };
          }
        },
        // Multiple checks are supported
        async (req) => {
          // Additional validation logic
        },
      ],
    },
    preHandler: (...)
  },
  async (request) => {
    // Your handler logic
  }
);
```

#

### Error Formatting

The plugin supports three error formats:

#### 1. Simple (default)

```json
{
  "errors": {
    "email": ["Invalid email"],
    "name": ["Required"]
  }
}
```

#### 2. Flat

```json
{
  "errors": {
    "email": "Invalid email",
    "name": "Required"
  }
}
```

#### 3. Detailed

```json
{
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["email"],
      "message": "Required"
    }
  ]
}
```

#

#### Special Field Handling

Keys starting with an underscore (`_`) in validation results are treated specially - they are promoted to the top level of the response object. This is useful for adding metadata or status codes to your error responses.

```typescript
app.post(
  "/login",
  {
    validation: {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }),
      },
      check: async (req) => {
        if (req.body.email === "admin@example.com") {
          return {
            _status: "unauthorized", // Will appear at the top level
            _code: 401, // Will appear at the top level
            email: "Admin access restricted",
            password: "Please use the admin portal",
          };
        }
      },
    },
  },
  async (request) => {
    // Your handler
  }
);
```

Response when validation fails:

```json
{
  "status": "unauthorized",
  "code": 401,
  "errors": {
    "email": "Admin access restricted",
    "password": "Please use the admin portal"
  }
}
```

#

### Using the `reject` Helper

For simpler error returns in your check functions, use the `reject` helper:

```typescript
import { reject } from "@explita/fastify-zod";

// In your route definition
app
  .schema({
    /* ... */
  })
  .check((req) => {
    if (!isValid(req.body)) {
      // Simple string error (returns { _message: "Invalid input" })
      return reject("Invalid input");

      // Or with custom error object
      return reject({
        field: "Invalid value",
        anotherField: "Must be a number",
      });
    }
  })
  .post("/example", handler);
```

#

### Custom Error Formatter

You can provide a custom formatter function to control the error response:

```typescript
await app.register(fastifyZod, {
  formatter: (issues) => ({
    success: false,
    errors: issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  }),
});
```

#

### Type Safety

The plugin provides full TypeScript support with proper type inference:

```typescript
app.post<{ Body: { name: string } }>(
  "/users",
  {
    validation: {
      schema: {
        body: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      },
      check: (req) => {
        // req.body is properly typed as { name: string, email: string }
        if (req.body.name === "test") {
          return { name: "Test user not allowed" };
        }
      },
    },
  },
  async (request) => {
    // request.body is properly typed
    return { name: request.body.name };
  }
);
```

## License

MIT

---

Built with ❤️ by [Explita](https://explita.ng)

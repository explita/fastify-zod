# Fastify Zod

A Fastify plugin that provides seamless integration with [Zod](https://zod.dev/) for request (before handler) validation. This plugin allows you to validate request body, query parameters, and route parameters using Zod schemas with minimal setup.

## Features

- 🚀 **Seamless Integration**: Works out of the box with Fastify v5+
- 🔍 **Comprehensive Validation**: Validate request body, query, and route parameters
- ⚡ **Async Support**: Built-in support for async validation
- 📦 **Type Safety**: Full TypeScript support
- 🔄 **Flexible Error Formatting**: Multiple error formatting options
- 📝 **Request Logging**: Built-in verbose logging for debugging

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
});

// Define your route with Zod validation
app.get(
  "/users/:id",
  {
    zodSchema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      query: z.object({
        page: z.string().optional().default("1"),
      }),
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

| Option    | Type                               | Default                    | Description                                  |
| --------- | ---------------------------------- | -------------------------- | -------------------------------------------- |
| `hint`    | `string`                           | `'Invalid data submitted'` | Custom error message for validation failures |
| `format`  | `'flat' \| 'detailed' \| 'simple'` | `'flat'`                   | Error format style                           |
| `verbose` | `boolean`                          | `true`                     | Enable/disable request validation logging    |

#

### Route Validation

You can validate different parts of the request by providing corresponding Zod schemas in the `zodSchema` route option:

```typescript
app.post(
  "/users",
  {
    zodSchema: {
      body: z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().int().positive().optional(),
      }),
      query: z.object({
        debug: z.enum(["true", "false"]).optional(),
      }),
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  },
  async (request) => {
    // Your handler logic here
  }
);
```

#

### Error Formatting

The plugin supports different error formats:

- `flat`: Returns a flat object of error messages
- `detailed`: Returns detailed error information including path and validation details - zodIssue[]
- `simple`: Returns a simple error message

#

### Error Response

When validation fails, the plugin returns a 400 response with the following structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "requestId": "req-1",
  "errors": ["Invalid email address"],
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#

## License

MIT

---

Built with ❤️ by [Explita](https://explita.ng)

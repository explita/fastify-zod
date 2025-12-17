# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-12-18

### Added

- New `reject` utility function for simplified error returns in check functions

  ```typescript
  // Before
  return { error: "Invalid input" };

  // After
  return reject("Invalid input"); // Returns { _message: "Invalid input" }
  return reject({ field: "error" }); // Returns { field: "error" }
  ```

### Fixed

- Fixed critical issue where schema validation errors were not properly halting execution, allowing invalid requests to reach route handlers

## [0.4.0] - 2025-12-15

### Added

- Chaining API with `fastify.schema()` method for fluent route definition
- defineRoute function for standalone route definition with validation
- Support for array of check functions in validation
- .pre() method for adding pre-handlers in the chaining API
- Enhanced type inference for empty or partial schema configurations
- Support for custom validation options per route

### Changed

- Improved type safety for multiPathError utility
- Better error handling for validation checks
- Updated documentation with comprehensive examples
- Refactored validation logic into separate `schema-validation.ts`
- Improved TypeScript type inference for better developer experience

## [0.3.0] - 2025-12-13

### Added

- Chaining API with `fastify.schema()` method for fluent route definition
- defineRoute function for standalone route definition with validation
- Support for array of check functions in validation
- Enhanced type inference for empty or partial schema configurations

### Changed

- Improved type safety for multiPathError utility
- Better error handling for validation checks
- Updated documentation with comprehensive examples

## [0.2.0] - 2025-12-11

### Added

- Support for custom validation functions with `check` option
- `multiPathError` utility for handling multiple field validations
- Soft validation mode to prevent throwing on invalid schemas
- Support for custom error formatters
- Enhanced TypeScript types for better type inference
- Support for async validation in check functions
- Special handling for underscored keys in validation results (e.g., `_status` becomes top-level in response)

### Changed

- Updated error response format to be more consistent
- Improved type safety throughout the codebase
- Better handling of nested validation errors
- More flexible error formatting options

## [0.1.0] - 2025-12-09

### Added

- Initial release of `@explita/fastify-zod`
- Support for request validation using Zod schemas
- Validation for request body, query parameters, and route parameters
- Configurable error formatting options
- TypeScript support
- Built-in request logging for debugging

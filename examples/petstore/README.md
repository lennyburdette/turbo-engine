# Petstore Example

A classic REST API example demonstrating how Turbo Engine composes an OpenAPI
service with a companion Postman collection into a single publishable ingress
package.

## Structure

```
petstore/
  turbo-engine.yaml            # Root ingress package
  packages/
    api/
      turbo-engine.yaml        # OpenAPI service manifest
      schema.openapi.yaml      # OpenAPI 3.1 schema (Pets CRUD)
    client/
      turbo-engine.yaml        # Postman collection manifest
      collection.json          # Pre-built request collection
```

## What It Demonstrates

- Declaring an **ingress** package that aggregates an API definition and a
  client collection.
- Writing a realistic **OpenAPI 3.1** schema with CRUD operations, request
  bodies, query parameters, and error responses.
- Pairing the API with a **Postman collection** so consumers get a runnable
  client out of the box.

## Publishing

```bash
# From the repository root
turbo-engine publish ./examples/petstore
```

Turbo Engine resolves the dependency graph, validates every schema, and
publishes the three packages (`petstore/api`, `petstore/client`, and the root
`petstore` ingress) as a single atomic unit.

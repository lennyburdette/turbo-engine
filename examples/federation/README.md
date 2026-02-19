# GraphQL Federation Example

A GraphQL supergraph composed of three domain subgraphs (Users, Products,
Reviews) and a shared operations package that contains the client-side queries
and mutations consumers run against the composed gateway.

## Structure

```
federation/
  turbo-engine.yaml                  # Root supergraph package
  packages/
    users/
      turbo-engine.yaml              # Users subgraph manifest
      schema.graphql                 # Federation v2 SDL
    products/
      turbo-engine.yaml              # Products subgraph manifest
      schema.graphql                 # Federation v2 SDL
    reviews/
      turbo-engine.yaml              # Reviews subgraph manifest
      schema.graphql                 # Federation v2 SDL (extends User & Product)
    operations/
      turbo-engine.yaml              # Operations package manifest
      operations.graphql             # Client queries & mutations
```

## What It Demonstrates

- Building a **GraphQL supergraph** from independently owned subgraphs.
- Using **Apollo Federation v2** directives (`@key`, `@external`, `@requires`,
  `@shareable`) to compose entities across service boundaries.
- Packaging reusable **GraphQL operations** alongside the schema so that
  consumers have validated queries from day one.

## Publishing

```bash
# From the repository root
turbo-engine publish ./examples/federation
```

Turbo Engine performs composition checks, validates every operation against the
composed supergraph schema, and publishes all five packages atomically.

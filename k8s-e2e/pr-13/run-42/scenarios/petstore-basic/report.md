# petstore-basic: ALL 14 TESTS PASSED

> Petstore API with RPC-to-REST orchestrator. Validates the full request chain: gateway → orchestrator → upstream API, including trace propagation.


## Test Results

| Test | Result | Detail | Time |
|------|--------|--------|------|
| publish-petstore-api | PASS | Published petstore-api@1.0.0 (HTTP 201) | 28ms |
| publish-petstore-orchestrator | PASS | Published petstore-orchestrator@1.0.0 (HTTP 201) | 3ms |
| create-environment | PASS | Created 4e803023934523a366aad7716690351a | 4ms |
| trigger-build | PASS | Build bld-1771712668917-1 triggered | 3ms |
| build-status | PASS | Build bld-1771712668917-1 succeeded | 3ms |
| operator-reconcile | PASS | Reconciled 2 components | 59ms |
| verify-k8s-resources | PASS | All 6 resources created | 266ms |
| pods-running | PASS | All pods running | 293ms |
| gateway-routing | PASS | Gateway route /api/pets/rpc/listPets active (HTTP 200) | 10015ms |
| list-pets-direct | PASS | HTTP 200; pets has 3 items (>= 1) | 2005ms |
| orchestrator-direct | PASS | HTTP 200; rpc=listPets; upstream_status=200 | 2005ms |
| e2e-list-pets | PASS | HTTP 200; rpc=listPets; upstream_status=200; result.pets has 3 items (>= 1) | 4ms |
| e2e-get-pet | PASS | HTTP 200; result.pet.name=Whiskers | 4ms |
| trace-propagation | PASS | HTTP 200; trace_id=a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5 | 3ms |

## Screenshots

### Console packages list after publishing petstore components

![packages](../../screenshots/petstore-basic/packages.png)


### Environments list showing the petstore-e2e environment

![environments](../../screenshots/petstore-basic/environments.png)


### Console dashboard overview

![dashboard](../../screenshots/petstore-basic/dashboard.png)


### Explorer mobile UI showing deployed services and traces

![explorer](../../screenshots/petstore-basic/explorer.png)


## Component Logs

<details><summary>petstore-api (13 lines)</summary>

```
{"level":"info","msg":"petstore mock starting","port":"8080","time":"2026-02-21T22:24:29.481828487Z"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T22:24:44.553609708Z","trace_id":"c4adc042ecacfba747e211219532c2e7","traceparent":"00-c4adc042ecacfba747e211219532c2e7-6c50e85341aafb79-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T22:24:44.553746341Z","trace_id":"c4adc042ecacfba747e211219532c2e7"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T22:24:46.559125806Z","trace_id":"","traceparent":"","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T22:24:46.559203119Z","trace_id":""}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T22:24:48.563638741Z","trace_id":"4adf9a927aeb49db922d73afd10d6ddc","traceparent":"00-4adf9a927aeb49db922d73afd10d6ddc-9a26a06e24bae6ea-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T22:24:48.563698071Z","trace_id":"4adf9a927aeb49db922d73afd10d6ddc"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T22:24:48.567509061Z","trace_id":"4b088442f24712604e094100404779fb","traceparent":"00-4b088442f24712604e094100404779fb-48031eb84e10ddb9-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T22:24:48.567536723Z","trace_id":"4b088442f24712604e094100404779fb"}
{"level":"info","method":"GET","msg":"request received","path":"/pets/2","query":"","time":"2026-02-21T22:24:48.571495093Z","trace_id":"9fd5005ba9a47bc7aee5714096bbd510","traceparent":"00-9fd5005ba9a47bc7aee5714096bbd510-cac1a854dc5552a6-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets/2","status":200,"time":"2026-02-21T22:24:48.571527373Z","trace_id":"9fd5005ba9a47bc7aee5714096bbd510"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T22:24:48.575258639Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-3f8d0e46183eab88-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T22:24:48.57529153Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>

<details><summary>petstore-orchestrator (21 lines)</summary>

```
{"level":"info","msg":"orchestrator starting","port":"8080","time":"2026-02-21T22:24:29.521723365Z","upstream_url":"http://svc-petstore-api:8080"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T22:24:44.55204523Z","trace_id":"c4adc042ecacfba747e211219532c2e7","traceparent":"00-c4adc042ecacfba747e211219532c2e7-e231d2c4439a957d-01","x_request_id":"be736c0b-4f08-4bc4-be49-f2d013a74989"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T22:24:44.552155525Z","trace_id":"c4adc042ecacfba747e211219532c2e7","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T22:24:44.553972333Z","trace_id":"c4adc042ecacfba747e211219532c2e7","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":2,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T22:24:44.554076547Z","trace_id":"c4adc042ecacfba747e211219532c2e7"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T22:24:48.563335566Z","trace_id":"","traceparent":"","x_request_id":""}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T22:24:48.563399234Z","trace_id":"","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T22:24:48.56390331Z","trace_id":"","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T22:24:48.56398428Z","trace_id":""}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T22:24:48.567329306Z","trace_id":"4b088442f24712604e094100404779fb","traceparent":"00-4b088442f24712604e094100404779fb-1b0825c8c549df32-01","x_request_id":"09786256-dc73-40ec-8436-0a5b31eabeec"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T22:24:48.56735857Z","trace_id":"4b088442f24712604e094100404779fb","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T22:24:48.567696857Z","trace_id":"4b088442f24712604e094100404779fb","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T22:24:48.567756749Z","trace_id":"4b088442f24712604e094100404779fb"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/getPet","query":"id=2","time":"2026-02-21T22:24:48.571301304Z","trace_id":"9fd5005ba9a47bc7aee5714096bbd510","traceparent":"00-9fd5005ba9a47bc7aee5714096bbd510-252102afbcdc232e-01","x_request_id":"256f6753-0603-4ca5-92b7-1a855026f036"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"getPet","time":"2026-02-21T22:24:48.571325499Z","trace_id":"9fd5005ba9a47bc7aee5714096bbd510","url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":118,"rpc":"getPet","time":"2026-02-21T22:24:48.571672703Z","trace_id":"9fd5005ba9a47bc7aee5714096bbd510","upstream_status":200,"url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/getPet","status":200,"time":"2026-02-21T22:24:48.571711184Z","trace_id":"9fd5005ba9a47bc7aee5714096bbd510"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T22:24:48.575037373Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-a3532358866855da-01","x_request_id":"59795a61-db44-4d2e-a39d-c264cd14df4b"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T22:24:48.575060536Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T22:24:48.575426958Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T22:24:48.575478063Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>


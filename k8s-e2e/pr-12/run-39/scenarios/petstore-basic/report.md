# petstore-basic: ALL 14 TESTS PASSED

> Petstore API with RPC-to-REST orchestrator. Validates the full request chain: gateway → orchestrator → upstream API, including trace propagation.


## Test Results

| Test | Result | Detail | Time |
|------|--------|--------|------|
| publish-petstore-api | PASS | Published petstore-api@1.0.0 (HTTP 201) | 28ms |
| publish-petstore-orchestrator | PASS | Published petstore-orchestrator@1.0.0 (HTTP 201) | 2ms |
| create-environment | PASS | Created e8b7a268e9827524482ec45ad7d0665b | 4ms |
| trigger-build | PASS | Build bld-1771704638742-1 triggered | 3ms |
| build-status | PASS | Build bld-1771704638742-1 succeeded | 3ms |
| operator-reconcile | PASS | Reconciled 2 components | 83ms |
| verify-k8s-resources | PASS | All 6 resources created | 290ms |
| pods-running | PASS | All pods running | 295ms |
| gateway-routing | PASS | Gateway route /api/pets/rpc/listPets active (HTTP 200) | 10014ms |
| list-pets-direct | PASS | HTTP 200; pets has 3 items (>= 1) | 2005ms |
| orchestrator-direct | PASS | HTTP 200; rpc=listPets; upstream_status=200 | 2006ms |
| e2e-list-pets | PASS | HTTP 200; rpc=listPets; upstream_status=200; result.pets has 3 items (>= 1) | 3ms |
| e2e-get-pet | PASS | HTTP 200; result.pet.name=Whiskers | 4ms |
| trace-propagation | PASS | HTTP 200; trace_id=a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5 | 6ms |

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
{"level":"info","msg":"petstore mock starting","port":"8080","time":"2026-02-21T20:10:39.322254947Z"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T20:10:54.426173238Z","trace_id":"bb6b9ad4107a1958eca811015796cceb","traceparent":"00-bb6b9ad4107a1958eca811015796cceb-c5cfb446953f7cf6-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T20:10:54.426318749Z","trace_id":"bb6b9ad4107a1958eca811015796cceb"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T20:10:56.431843082Z","trace_id":"","traceparent":"","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T20:10:56.431893425Z","trace_id":""}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T20:10:58.437163245Z","trace_id":"e2386712ff26ba08b0485f7eb2f53bac","traceparent":"00-e2386712ff26ba08b0485f7eb2f53bac-fa3e8f1ece776476-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T20:10:58.437211014Z","trace_id":"e2386712ff26ba08b0485f7eb2f53bac"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T20:10:58.44101131Z","trace_id":"499085f1d6a472d51fe53b7e0a71da44","traceparent":"00-499085f1d6a472d51fe53b7e0a71da44-21693b33355d6566-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T20:10:58.441083144Z","trace_id":"499085f1d6a472d51fe53b7e0a71da44"}
{"level":"info","method":"GET","msg":"request received","path":"/pets/2","query":"","time":"2026-02-21T20:10:58.445099455Z","trace_id":"e9304ee68bf7bd9572b216111506b07b","traceparent":"00-e9304ee68bf7bd9572b216111506b07b-ad87e5e76803f69a-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets/2","status":200,"time":"2026-02-21T20:10:58.445126836Z","trace_id":"e9304ee68bf7bd9572b216111506b07b"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T20:10:58.45095791Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-109c7ca16aa5617c-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T20:10:58.451088974Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>

<details><summary>petstore-orchestrator (21 lines)</summary>

```
{"level":"info","msg":"orchestrator starting","port":"8080","time":"2026-02-21T20:10:39.351875939Z","upstream_url":"http://svc-petstore-api:8080"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T20:10:54.424781836Z","trace_id":"bb6b9ad4107a1958eca811015796cceb","traceparent":"00-bb6b9ad4107a1958eca811015796cceb-e9b234733543c38c-01","x_request_id":"a387d4be-02d1-486d-a815-8374f3f0c765"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T20:10:54.424871393Z","trace_id":"bb6b9ad4107a1958eca811015796cceb","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T20:10:54.426587999Z","trace_id":"bb6b9ad4107a1958eca811015796cceb","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T20:10:54.426694327Z","trace_id":"bb6b9ad4107a1958eca811015796cceb"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T20:10:58.436813058Z","trace_id":"","traceparent":"","x_request_id":""}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T20:10:58.43686806Z","trace_id":"","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T20:10:58.437411553Z","trace_id":"","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T20:10:58.437491912Z","trace_id":""}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T20:10:58.440762851Z","trace_id":"499085f1d6a472d51fe53b7e0a71da44","traceparent":"00-499085f1d6a472d51fe53b7e0a71da44-36144117d9ea411a-01","x_request_id":"a8f2a347-d5db-497e-8866-05a646e79cb2"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T20:10:58.440784461Z","trace_id":"499085f1d6a472d51fe53b7e0a71da44","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T20:10:58.441238342Z","trace_id":"499085f1d6a472d51fe53b7e0a71da44","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T20:10:58.441290599Z","trace_id":"499085f1d6a472d51fe53b7e0a71da44"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/getPet","query":"id=2","time":"2026-02-21T20:10:58.444838459Z","trace_id":"e9304ee68bf7bd9572b216111506b07b","traceparent":"00-e9304ee68bf7bd9572b216111506b07b-e5b9b56b0e313fb7-01","x_request_id":"1c5da29d-f27e-49ce-acde-7b33c31cc4ac"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"getPet","time":"2026-02-21T20:10:58.444879505Z","trace_id":"e9304ee68bf7bd9572b216111506b07b","url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":118,"rpc":"getPet","time":"2026-02-21T20:10:58.445301031Z","trace_id":"e9304ee68bf7bd9572b216111506b07b","upstream_status":200,"url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/getPet","status":200,"time":"2026-02-21T20:10:58.445361443Z","trace_id":"e9304ee68bf7bd9572b216111506b07b"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T20:10:58.450505823Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-c50ac3de619a09c5-01","x_request_id":"0314b504-30e7-47a7-8119-e09b9a3353ac"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T20:10:58.450544906Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T20:10:58.451304379Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T20:10:58.451373227Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>


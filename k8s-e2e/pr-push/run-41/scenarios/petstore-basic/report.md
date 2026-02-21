# petstore-basic: ALL 14 TESTS PASSED

> Petstore API with RPC-to-REST orchestrator. Validates the full request chain: gateway → orchestrator → upstream API, including trace propagation.


## Test Results

| Test | Result | Detail | Time |
|------|--------|--------|------|
| publish-petstore-api | PASS | Published petstore-api@1.0.0 (HTTP 201) | 27ms |
| publish-petstore-orchestrator | PASS | Published petstore-orchestrator@1.0.0 (HTTP 201) | 2ms |
| create-environment | PASS | Created 649d24a5c1cb164e8090fbe0f664ed49 | 3ms |
| trigger-build | PASS | Build bld-1771708613966-1 triggered | 2ms |
| build-status | PASS | Build bld-1771708613966-1 succeeded | 2ms |
| operator-reconcile | PASS | Reconciled 2 components | 51ms |
| verify-k8s-resources | PASS | All 6 resources created | 265ms |
| pods-running | PASS | All pods running | 292ms |
| gateway-routing | PASS | Gateway route /api/pets/rpc/listPets active (HTTP 200) | 5011ms |
| list-pets-direct | PASS | HTTP 200; pets has 3 items (>= 1) | 2004ms |
| orchestrator-direct | PASS | HTTP 200; rpc=listPets; upstream_status=200 | 2006ms |
| e2e-list-pets | PASS | HTTP 200; rpc=listPets; upstream_status=200; result.pets has 3 items (>= 1) | 3ms |
| e2e-get-pet | PASS | HTTP 200; result.pet.name=Whiskers | 3ms |
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
{"level":"info","msg":"petstore mock starting","port":"8080","time":"2026-02-21T21:16:54.49710998Z"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T21:17:04.587319308Z","trace_id":"cf20050ba8e173690e878d1acb9fba49","traceparent":"00-cf20050ba8e173690e878d1acb9fba49-ae23094996ddb74b-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T21:17:04.587434857Z","trace_id":"cf20050ba8e173690e878d1acb9fba49"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T21:17:06.592326913Z","trace_id":"","traceparent":"","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T21:17:06.592367651Z","trace_id":""}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T21:17:08.597491516Z","trace_id":"2325ccb4e5ab70aebf92a002e975956d","traceparent":"00-2325ccb4e5ab70aebf92a002e975956d-823019c058897ba8-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T21:17:08.59753795Z","trace_id":"2325ccb4e5ab70aebf92a002e975956d"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T21:17:08.600868969Z","trace_id":"c12db6d9570a8076961427e887a6e2fe","traceparent":"00-c12db6d9570a8076961427e887a6e2fe-8cb2fadbc6e5bdc8-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T21:17:08.60090446Z","trace_id":"c12db6d9570a8076961427e887a6e2fe"}
{"level":"info","method":"GET","msg":"request received","path":"/pets/2","query":"","time":"2026-02-21T21:17:08.604154593Z","trace_id":"01032ec9e2aafbceae193549b557eb9c","traceparent":"00-01032ec9e2aafbceae193549b557eb9c-67691396de97ee2d-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets/2","status":200,"time":"2026-02-21T21:17:08.604199327Z","trace_id":"01032ec9e2aafbceae193549b557eb9c"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T21:17:08.607178036Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-00e501eb6ecad47c-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T21:17:08.607208577Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>

<details><summary>petstore-orchestrator (21 lines)</summary>

```
{"level":"info","msg":"orchestrator starting","port":"8080","time":"2026-02-21T21:16:54.531642342Z","upstream_url":"http://svc-petstore-api:8080"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T21:17:04.585656683Z","trace_id":"cf20050ba8e173690e878d1acb9fba49","traceparent":"00-cf20050ba8e173690e878d1acb9fba49-4eed18446c0c6ef4-01","x_request_id":"4fbed3ca-62f2-474d-9c02-d6edeca96822"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T21:17:04.585732242Z","trace_id":"cf20050ba8e173690e878d1acb9fba49","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T21:17:04.587638506Z","trace_id":"cf20050ba8e173690e878d1acb9fba49","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":2,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T21:17:04.587748415Z","trace_id":"cf20050ba8e173690e878d1acb9fba49"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T21:17:08.597155001Z","trace_id":"","traceparent":"","x_request_id":""}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T21:17:08.597221069Z","trace_id":"","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T21:17:08.597715854Z","trace_id":"","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T21:17:08.597810184Z","trace_id":""}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T21:17:08.600654563Z","trace_id":"c12db6d9570a8076961427e887a6e2fe","traceparent":"00-c12db6d9570a8076961427e887a6e2fe-dcffc1ee49fb1ff8-01","x_request_id":"102eb4aa-711d-4788-87ff-047c83df7fb2"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T21:17:08.600683256Z","trace_id":"c12db6d9570a8076961427e887a6e2fe","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T21:17:08.601062437Z","trace_id":"c12db6d9570a8076961427e887a6e2fe","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T21:17:08.601133026Z","trace_id":"c12db6d9570a8076961427e887a6e2fe"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/getPet","query":"id=2","time":"2026-02-21T21:17:08.603937916Z","trace_id":"01032ec9e2aafbceae193549b557eb9c","traceparent":"00-01032ec9e2aafbceae193549b557eb9c-03230ace05d59c2b-01","x_request_id":"0b1ac3a5-fd5b-49c1-beae-3ad966760a14"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"getPet","time":"2026-02-21T21:17:08.603974642Z","trace_id":"01032ec9e2aafbceae193549b557eb9c","url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":118,"rpc":"getPet","time":"2026-02-21T21:17:08.604361864Z","trace_id":"01032ec9e2aafbceae193549b557eb9c","upstream_status":200,"url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/getPet","status":200,"time":"2026-02-21T21:17:08.604418393Z","trace_id":"01032ec9e2aafbceae193549b557eb9c"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T21:17:08.607010345Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-15f4321867e7b89b-01","x_request_id":"d3c29f0d-7034-4699-b2fc-c2b1839a2f27"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T21:17:08.607031341Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T21:17:08.607366Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T21:17:08.607419021Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>


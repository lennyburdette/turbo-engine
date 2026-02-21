# petstore-basic: ALL 14 TESTS PASSED

> Petstore API with RPC-to-REST orchestrator. Validates the full request chain: gateway → orchestrator → upstream API, including trace propagation.


## Test Results

| Test | Result | Detail | Time |
|------|--------|--------|------|
| publish-petstore-api | PASS | Published petstore-api@1.0.0 (HTTP 201) | 28ms |
| publish-petstore-orchestrator | PASS | Published petstore-orchestrator@1.0.0 (HTTP 201) | 3ms |
| create-environment | PASS | Created f15add989310e4676ae9724e201ed2e2 | 4ms |
| trigger-build | PASS | Build bld-1771703406194-1 triggered | 3ms |
| build-status | PASS | Build bld-1771703406194-1 succeeded | 3ms |
| operator-reconcile | PASS | Reconciled 2 components | 58ms |
| verify-k8s-resources | PASS | All 6 resources created | 273ms |
| pods-running | PASS | All pods running | 293ms |
| gateway-routing | PASS | Gateway route /api/pets/rpc/listPets active (HTTP 200) | 7ms |
| list-pets-direct | PASS | HTTP 200; pets has 3 items (>= 1) | 2005ms |
| orchestrator-direct | PASS | HTTP 200; rpc=listPets; upstream_status=200 | 2005ms |
| e2e-list-pets | PASS | HTTP 200; rpc=listPets; upstream_status=200; result.pets has 3 items (>= 1) | 4ms |
| e2e-get-pet | PASS | HTTP 200; result.pet.name=Whiskers | 3ms |
| trace-propagation | PASS | HTTP 200; trace_id=a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5 | 6ms |

## Screenshots

### Console packages list after publishing petstore components

![packages](../screenshots/petstore-basic/packages.png)


### Environments list showing the petstore-e2e environment

![environments](../screenshots/petstore-basic/environments.png)


### Console dashboard overview

![dashboard](../screenshots/petstore-basic/dashboard.png)


### Explorer mobile UI showing deployed services and traces

![explorer](../screenshots/petstore-basic/explorer.png)


## Component Logs

<details><summary>petstore-api (13 lines)</summary>

```
{"level":"info","msg":"petstore mock starting","port":"8080","time":"2026-02-21T19:50:06.770888515Z"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T19:50:11.829435352Z","trace_id":"a79ea0c4e8b6e58cc7e93ad4ac55dca3","traceparent":"00-a79ea0c4e8b6e58cc7e93ad4ac55dca3-cf63c3f1234bcb56-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T19:50:11.829564604Z","trace_id":"a79ea0c4e8b6e58cc7e93ad4ac55dca3"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T19:50:13.834857525Z","trace_id":"","traceparent":"","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T19:50:13.834905755Z","trace_id":""}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T19:50:15.839568769Z","trace_id":"a0dc9c579d3b7c83444128e76d5535aa","traceparent":"00-a0dc9c579d3b7c83444128e76d5535aa-97b6e073f5ef5983-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T19:50:15.839608093Z","trace_id":"a0dc9c579d3b7c83444128e76d5535aa"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T19:50:15.843604243Z","trace_id":"8074499a8eb85211acb574057d1c438e","traceparent":"00-8074499a8eb85211acb574057d1c438e-1fe8af4b25a3ff01-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T19:50:15.843636583Z","trace_id":"8074499a8eb85211acb574057d1c438e"}
{"level":"info","method":"GET","msg":"request received","path":"/pets/2","query":"","time":"2026-02-21T19:50:15.84724289Z","trace_id":"8ad298e93ffb8b220ae358d2df9cef78","traceparent":"00-8ad298e93ffb8b220ae358d2df9cef78-6a5fdc782423d1e9-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets/2","status":200,"time":"2026-02-21T19:50:15.847269109Z","trace_id":"8ad298e93ffb8b220ae358d2df9cef78"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T19:50:15.852588919Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-3368d441b4a45968-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T19:50:15.852667246Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>

<details><summary>petstore-orchestrator (21 lines)</summary>

```
{"level":"info","msg":"orchestrator starting","port":"8080","time":"2026-02-21T19:50:06.773654488Z","upstream_url":"http://svc-petstore-api:8080"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T19:50:11.827942164Z","trace_id":"a79ea0c4e8b6e58cc7e93ad4ac55dca3","traceparent":"00-a79ea0c4e8b6e58cc7e93ad4ac55dca3-9509b25364d972ef-01","x_request_id":"11c96f1c-da4c-48c6-92e9-c084c998183a"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T19:50:11.82802553Z","trace_id":"a79ea0c4e8b6e58cc7e93ad4ac55dca3","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T19:50:11.829816177Z","trace_id":"a79ea0c4e8b6e58cc7e93ad4ac55dca3","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T19:50:11.829889965Z","trace_id":"a79ea0c4e8b6e58cc7e93ad4ac55dca3"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T19:50:15.839265112Z","trace_id":"","traceparent":"","x_request_id":""}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T19:50:15.839325124Z","trace_id":"","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T19:50:15.839794795Z","trace_id":"","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T19:50:15.839883811Z","trace_id":""}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T19:50:15.843460291Z","trace_id":"8074499a8eb85211acb574057d1c438e","traceparent":"00-8074499a8eb85211acb574057d1c438e-c7fdd32c3a8fdabb-01","x_request_id":"f9eafa86-4dc4-44c2-95bc-4cbb80408b04"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T19:50:15.843482042Z","trace_id":"8074499a8eb85211acb574057d1c438e","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T19:50:15.843766897Z","trace_id":"8074499a8eb85211acb574057d1c438e","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T19:50:15.843812283Z","trace_id":"8074499a8eb85211acb574057d1c438e"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/getPet","query":"id=2","time":"2026-02-21T19:50:15.847073063Z","trace_id":"8ad298e93ffb8b220ae358d2df9cef78","traceparent":"00-8ad298e93ffb8b220ae358d2df9cef78-e3ad35cd5cf91808-01","x_request_id":"401f5881-9001-45b4-96db-19427cc089ab"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"getPet","time":"2026-02-21T19:50:15.847099312Z","trace_id":"8ad298e93ffb8b220ae358d2df9cef78","url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":118,"rpc":"getPet","time":"2026-02-21T19:50:15.847413299Z","trace_id":"8ad298e93ffb8b220ae358d2df9cef78","upstream_status":200,"url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/getPet","status":200,"time":"2026-02-21T19:50:15.847459525Z","trace_id":"8ad298e93ffb8b220ae358d2df9cef78"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T19:50:15.852146849Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-d84ea29553bcf28b-01","x_request_id":"e57e4041-e336-40f5-986c-73d6595c0bda"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T19:50:15.852178709Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T19:50:15.852839789Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T19:50:15.852886287Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>


# petstore-basic: 1 FAILED (13/14 passed)

> Petstore API with RPC-to-REST orchestrator. Validates the full request chain: gateway → orchestrator → upstream API, including trace propagation.


## Test Results

| Test | Result | Detail | Time |
|------|--------|--------|------|
| publish-petstore-api | PASS | Published petstore-api@1.0.0 (HTTP 201) | 28ms |
| publish-petstore-orchestrator | PASS | Published petstore-orchestrator@1.0.0 (HTTP 201) | 4ms |
| create-environment | PASS | Created 45de9454cf5902396338962571813693 | 3ms |
| trigger-build | PASS | Build bld-1771715780928-1 triggered | 3ms |
| build-status | PASS | Build bld-1771715780928-1 succeeded | 3ms |
| operator-reconcile | PASS | Reconciled 2 components | 58ms |
| verify-k8s-resources | PASS | All 6 resources created | 290ms |
| pods-running | PASS | All pods running | 303ms |
| gateway-routing | PASS | Gateway route /api/pets/rpc/listPets active (HTTP 200) | 8ms |
| list-pets-direct | PASS | HTTP 200; pets has 3 items (>= 1) | 2004ms |
| orchestrator-direct | PASS | HTTP 200; rpc=listPets; upstream_status=200 | 2006ms |
| e2e-list-pets | PASS | HTTP 200; rpc=listPets; upstream_status=200; result.pets has 3 items (>= 1) | 3ms |
| e2e-get-pet | PASS | HTTP 200; result.pet.name=Whiskers | 4ms |
| trace-propagation | **FAIL** | HTTP 200; trace_id: expected 'a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5', got 'b31e7208ce63cd5a02daf3ece18fcd56' | 4ms |

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
{"level":"info","msg":"petstore mock starting","port":"8080","time":"2026-02-21T23:16:21.499708774Z"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:16:26.589114871Z","trace_id":"2c3b9a63d0fae472171550c75553d952","traceparent":"00-2c3b9a63d0fae472171550c75553d952-ad7f28f9156ea474-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:16:26.589249362Z","trace_id":"2c3b9a63d0fae472171550c75553d952"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:16:28.594029829Z","trace_id":"d9ace8a57d6ed090d6c7dc02cf21e7a2","traceparent":"00-d9ace8a57d6ed090d6c7dc02cf21e7a2-dd6ae2f3cf051fa9-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:16:28.594072829Z","trace_id":"d9ace8a57d6ed090d6c7dc02cf21e7a2"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:16:30.599120783Z","trace_id":"51db2cf3c55e81f8735c1b34f256e240","traceparent":"00-51db2cf3c55e81f8735c1b34f256e240-5662265c0af76f18-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:16:30.599171137Z","trace_id":"51db2cf3c55e81f8735c1b34f256e240"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:16:30.602776441Z","trace_id":"815cdd1909b4988ef2446abc8f4f4adf","traceparent":"00-815cdd1909b4988ef2446abc8f4f4adf-65a83bc88e6bae3b-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:16:30.602802009Z","trace_id":"815cdd1909b4988ef2446abc8f4f4adf"}
{"level":"info","method":"GET","msg":"request received","path":"/pets/2","query":"","time":"2026-02-21T23:16:30.606498003Z","trace_id":"72088b9c45e03c8a336b4aa12144fb16","traceparent":"00-72088b9c45e03c8a336b4aa12144fb16-044433f242a69e2a-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets/2","status":200,"time":"2026-02-21T23:16:30.606535423Z","trace_id":"72088b9c45e03c8a336b4aa12144fb16"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:16:30.610145041Z","trace_id":"b31e7208ce63cd5a02daf3ece18fcd56","traceparent":"00-b31e7208ce63cd5a02daf3ece18fcd56-fa4f13bd8c9ff238-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:16:30.610170599Z","trace_id":"b31e7208ce63cd5a02daf3ece18fcd56"}
```

</details>

<details><summary>petstore-orchestrator (21 lines)</summary>

```
{"level":"info","msg":"orchestrator starting","port":"8080","time":"2026-02-21T23:16:21.537510623Z","upstream_url":"http://svc-petstore-api:8080"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:16:26.587839364Z","trace_id":"2c3b9a63d0fae472171550c75553d952","traceparent":"00-2c3b9a63d0fae472171550c75553d952-c7445fd02883e63a-01","x_request_id":"bca0502d-2d4b-448c-ad18-c9e27509f901"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:16:26.587953757Z","trace_id":"2c3b9a63d0fae472171550c75553d952","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:16:26.589474556Z","trace_id":"2c3b9a63d0fae472171550c75553d952","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:16:26.589580604Z","trace_id":"2c3b9a63d0fae472171550c75553d952"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:16:30.598813811Z","trace_id":"51db2cf3c55e81f8735c1b34f256e240","traceparent":"00-51db2cf3c55e81f8735c1b34f256e240-df56f7542cc014b0-01","x_request_id":""}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:16:30.598890674Z","trace_id":"51db2cf3c55e81f8735c1b34f256e240","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:16:30.599351707Z","trace_id":"51db2cf3c55e81f8735c1b34f256e240","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:16:30.599406019Z","trace_id":"51db2cf3c55e81f8735c1b34f256e240"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:16:30.602614786Z","trace_id":"815cdd1909b4988ef2446abc8f4f4adf","traceparent":"00-815cdd1909b4988ef2446abc8f4f4adf-20e91409029f24ae-01","x_request_id":"cab42afb-74e9-4fdc-92ec-b5c50fb94b11"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:16:30.602635104Z","trace_id":"815cdd1909b4988ef2446abc8f4f4adf","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:16:30.603009291Z","trace_id":"815cdd1909b4988ef2446abc8f4f4adf","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:16:30.603072048Z","trace_id":"815cdd1909b4988ef2446abc8f4f4adf"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/getPet","query":"id=2","time":"2026-02-21T23:16:30.606339618Z","trace_id":"72088b9c45e03c8a336b4aa12144fb16","traceparent":"00-72088b9c45e03c8a336b4aa12144fb16-d1fa60f99336c5f7-01","x_request_id":"35e701c8-228c-45cc-8f04-489f3aa98054"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"getPet","time":"2026-02-21T23:16:30.606366037Z","trace_id":"72088b9c45e03c8a336b4aa12144fb16","url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":118,"rpc":"getPet","time":"2026-02-21T23:16:30.606700231Z","trace_id":"72088b9c45e03c8a336b4aa12144fb16","upstream_status":200,"url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/getPet","status":200,"time":"2026-02-21T23:16:30.606752468Z","trace_id":"72088b9c45e03c8a336b4aa12144fb16"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:16:30.609969854Z","trace_id":"b31e7208ce63cd5a02daf3ece18fcd56","traceparent":"00-b31e7208ce63cd5a02daf3ece18fcd56-1ecd3d702b5012fa-01","x_request_id":"783b79b7-1ecb-406d-ad95-76ccef069a97"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:16:30.60999515Z","trace_id":"b31e7208ce63cd5a02daf3ece18fcd56","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:16:30.610337801Z","trace_id":"b31e7208ce63cd5a02daf3ece18fcd56","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:16:30.610385109Z","trace_id":"b31e7208ce63cd5a02daf3ece18fcd56"}
```

</details>


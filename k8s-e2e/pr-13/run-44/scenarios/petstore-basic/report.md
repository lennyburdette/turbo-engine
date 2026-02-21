# petstore-basic: ALL 14 TESTS PASSED

> Petstore API with RPC-to-REST orchestrator. Validates the full request chain: gateway → orchestrator → upstream API, including trace propagation.


## Test Results

| Test | Result | Detail | Time |
|------|--------|--------|------|
| publish-petstore-api | PASS | Published petstore-api@1.0.0 (HTTP 201) | 28ms |
| publish-petstore-orchestrator | PASS | Published petstore-orchestrator@1.0.0 (HTTP 201) | 4ms |
| create-environment | PASS | Created 8ec8c1a6080e0ec5d2235e797fb562bb | 3ms |
| trigger-build | PASS | Build bld-1771716440579-1 triggered | 3ms |
| build-status | PASS | Build bld-1771716440579-1 succeeded | 3ms |
| operator-reconcile | PASS | Reconciled 2 components | 64ms |
| verify-k8s-resources | PASS | All 6 resources created | 279ms |
| pods-running | PASS | All pods running | 299ms |
| gateway-routing | PASS | Gateway route /api/pets/rpc/listPets active (HTTP 200) | 8ms |
| list-pets-direct | PASS | HTTP 200; pets has 3 items (>= 1) | 2004ms |
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
{"level":"info","msg":"petstore mock starting","port":"8080","time":"2026-02-21T23:27:21.161332301Z"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:27:26.232688386Z","trace_id":"f0cfe47273bc774905517c2be6b9919a","traceparent":"00-f0cfe47273bc774905517c2be6b9919a-bb8d9591cdac9c3a-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:27:26.232838848Z","trace_id":"f0cfe47273bc774905517c2be6b9919a"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:27:28.237521561Z","trace_id":"2316e5c6ec9246daec66757351bcbcdd","traceparent":"00-2316e5c6ec9246daec66757351bcbcdd-1f807c280b65c8d1-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:27:28.237566776Z","trace_id":"2316e5c6ec9246daec66757351bcbcdd"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:27:30.242296662Z","trace_id":"449017c400a6582f3aa905963d0b479d","traceparent":"00-449017c400a6582f3aa905963d0b479d-e808497abdd9a19b-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:27:30.242342748Z","trace_id":"449017c400a6582f3aa905963d0b479d"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:27:30.24605533Z","trace_id":"7e273d9afb17e6205a1d7fcf0ce33918","traceparent":"00-7e273d9afb17e6205a1d7fcf0ce33918-f56cbf68b4225f77-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:27:30.246085897Z","trace_id":"7e273d9afb17e6205a1d7fcf0ce33918"}
{"level":"info","method":"GET","msg":"request received","path":"/pets/2","query":"","time":"2026-02-21T23:27:30.249902348Z","trace_id":"78eaadad438f4181cf4048b3f71ad55b","traceparent":"00-78eaadad438f4181cf4048b3f71ad55b-f2e118e812859a84-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets/2","status":200,"time":"2026-02-21T23:27:30.249937434Z","trace_id":"78eaadad438f4181cf4048b3f71ad55b"}
{"level":"info","method":"GET","msg":"request received","path":"/pets","query":"","time":"2026-02-21T23:27:30.253483759Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-466d15308159b921-01","x_request_id":""}
{"duration_ms":0,"level":"info","method":"GET","msg":"response sent","path":"/pets","status":200,"time":"2026-02-21T23:27:30.253509778Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>

<details><summary>petstore-orchestrator (21 lines)</summary>

```
{"level":"info","msg":"orchestrator starting","port":"8080","time":"2026-02-21T23:27:21.174521323Z","upstream_url":"http://svc-petstore-api:8080"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:27:26.231380101Z","trace_id":"f0cfe47273bc774905517c2be6b9919a","traceparent":"00-f0cfe47273bc774905517c2be6b9919a-832c7c45866623e3-01","x_request_id":"6b9044bd-fc6e-48e2-a594-969baf9124a8"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:27:26.231495958Z","trace_id":"f0cfe47273bc774905517c2be6b9919a","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:27:26.233082541Z","trace_id":"f0cfe47273bc774905517c2be6b9919a","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":1,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:27:26.233162211Z","trace_id":"f0cfe47273bc774905517c2be6b9919a"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:27:30.241989028Z","trace_id":"449017c400a6582f3aa905963d0b479d","traceparent":"00-449017c400a6582f3aa905963d0b479d-87fba13f67192aea-01","x_request_id":""}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:27:30.242045384Z","trace_id":"449017c400a6582f3aa905963d0b479d","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:27:30.242568173Z","trace_id":"449017c400a6582f3aa905963d0b479d","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:27:30.24262532Z","trace_id":"449017c400a6582f3aa905963d0b479d"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:27:30.245887258Z","trace_id":"7e273d9afb17e6205a1d7fcf0ce33918","traceparent":"00-7e273d9afb17e6205a1d7fcf0ce33918-d3cbc57ffd974c74-01","x_request_id":"e2ce6ef6-f6c8-443f-91b7-e8e41c18a213"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:27:30.245907596Z","trace_id":"7e273d9afb17e6205a1d7fcf0ce33918","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:27:30.246224597Z","trace_id":"7e273d9afb17e6205a1d7fcf0ce33918","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:27:30.246285401Z","trace_id":"7e273d9afb17e6205a1d7fcf0ce33918"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/getPet","query":"id=2","time":"2026-02-21T23:27:30.249693357Z","trace_id":"78eaadad438f4181cf4048b3f71ad55b","traceparent":"00-78eaadad438f4181cf4048b3f71ad55b-272ddf1589132783-01","x_request_id":"4db97d8a-6f1c-4c6a-bba4-5f9c1a9d5bd0"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"getPet","time":"2026-02-21T23:27:30.249723964Z","trace_id":"78eaadad438f4181cf4048b3f71ad55b","url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":118,"rpc":"getPet","time":"2026-02-21T23:27:30.250087104Z","trace_id":"78eaadad438f4181cf4048b3f71ad55b","upstream_status":200,"url":"http://svc-petstore-api:8080/pets/2"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/getPet","status":200,"time":"2026-02-21T23:27:30.250130565Z","trace_id":"78eaadad438f4181cf4048b3f71ad55b"}
{"level":"info","method":"POST","msg":"request received","path":"/rpc/listPets","query":"","time":"2026-02-21T23:27:30.253288195Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","traceparent":"00-a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5-daa0fea5606826a6-01","x_request_id":"99e7d1c9-fd61-4244-89d8-8ef902893670"}
{"level":"info","method":"GET","msg":"upstream call start","rpc":"listPets","time":"2026-02-21T23:27:30.253309756Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","msg":"upstream call complete","response_bytes":240,"rpc":"listPets","time":"2026-02-21T23:27:30.253636447Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5","upstream_status":200,"url":"http://svc-petstore-api:8080/pets"}
{"duration_ms":0,"level":"info","method":"POST","msg":"response sent","path":"/rpc/listPets","status":200,"time":"2026-02-21T23:27:30.253689286Z","trace_id":"a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"}
```

</details>


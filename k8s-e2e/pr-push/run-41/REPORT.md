# K8s E2E Report

**Generated:** 2026-02-21T21:17:31Z

**ALL 16 TESTS PASSED**

```
00:00  Waiting for control plane deployments to roll out
00:00  Control plane ready
00:00  Setting up port-forwards
00:07  Port-forwards healthy
00:07  Running scenario: petstore-basic
00:41  Scenario petstore-basic: 14/14 passed
00:41  Tests complete: 16 passed, 0 failed
```

## Scenarios

### [petstore-basic: ALL 14 TESTS PASSED](./scenarios/petstore-basic/report.md)

4 screenshots | [traces](./traces.html)

## Platform Health

**Pods:** 11/11 running

<details><summary>Full resource list</summary>

```
NAME                                                READY   STATUS    RESTARTS   AGE   IP            NODE                             NOMINATED NODE   READINESS GATES
pod/builder-678474bf88-67fwt                        1/1     Running   0          81s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-g96k7                         1/1     Running   0          81s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-6b7b865c95-czkhm            1/1     Running   0          34s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-68fc6bd898-6fgts   1/1     Running   0          33s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-4kvzt                     1/1     Running   0          81s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-cgvzb                        1/1     Running   0          81s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-j7fdz                        1/1     Running   0          81s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-676ng                          1/1     Running   0          81s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-qc9fb                 1/1     Running   0          81s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-5lx4t                       1/1     Running   0          81s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-p9bns          1/1     Running   0          81s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.221.189   <none>        8082/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.108.159   <none>        3000/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.120.113   <none>        8083/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.180.247   <none>        3001/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.96.88     <none>        8080/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.102.210   <none>        16686/TCP,4317/TCP   81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.80.15     <none>        4317/TCP,4318/TCP    81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.18.232    <none>        8081/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.99.139    <none>        8080/TCP             34s   app.kubernetes.io/instance=649d24a5c1cb164e8090fbe0f664ed49,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.108.191   <none>        8080/TCP             33s   app.kubernetes.io/instance=649d24a5c1cb164e8090fbe0f664ed49,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.100.1     <none>        8084/TCP             81s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           81s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           81s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           34s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=649d24a5c1cb164e8090fbe0f664ed49,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           34s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=649d24a5c1cb164e8090fbe0f664ed49,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           81s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           81s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           81s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           81s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           81s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           81s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           81s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                      DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                        1         1         1       81s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                         1         1         1       81s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-6b7b865c95            1         1         1       34s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=649d24a5c1cb164e8090fbe0f664ed49,app.kubernetes.io/name=petstore-api,pod-template-hash=6b7b865c95
replicaset.apps/deploy-petstore-orchestrator-68fc6bd898   1         1         1       33s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=649d24a5c1cb164e8090fbe0f664ed49,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=68fc6bd898
replicaset.apps/envmanager-76c64c8cc9                     1         1         1       81s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                        1         1         1       81s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                        1         1         1       81s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                          1         1         1       81s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                 1         1         1       81s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                       1         1         1       81s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4          1         1         1       81s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 4  **builder:** 29  **envmanager:** 16  **gateway:** 5  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (69 lines)</summary>

```
LAST SEEN   TYPE     REASON              OBJECT                                               MESSAGE
82s         Normal   Created             pod/envmanager-76c64c8cc9-4kvzt                      Container created
82s         Normal   ScalingReplicaSet   deployment/gateway                                   Scaled up replica set gateway-586c64fdf5 from 0 to 1
82s         Normal   Created             pod/builder-678474bf88-67fwt                         Container created
82s         Normal   Started             pod/builder-678474bf88-67fwt                         Container started
82s         Normal   SuccessfulCreate    replicaset/builder-678474bf88                        Created pod: builder-678474bf88-67fwt
82s         Normal   ScalingReplicaSet   deployment/builder                                   Scaled up replica set builder-678474bf88 from 0 to 1
82s         Normal   Scheduled           pod/console-78fbd5c84-g96k7                          Successfully assigned turbo-engine-e2e/console-78fbd5c84-g96k7 to turbo-engine-e2e-control-plane
82s         Normal   Pulled              pod/console-78fbd5c84-g96k7                          Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
82s         Normal   Created             pod/console-78fbd5c84-g96k7                          Container created
82s         Normal   ScalingReplicaSet   deployment/otel-collector                            Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
82s         Normal   SuccessfulCreate    replicaset/console-78fbd5c84                         Created pod: console-78fbd5c84-g96k7
82s         Normal   ScalingReplicaSet   deployment/console                                   Scaled up replica set console-78fbd5c84 from 0 to 1
82s         Normal   ScalingReplicaSet   deployment/turbo-engine-operator                     Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
82s         Normal   SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4          Created pod: turbo-engine-operator-7cd95f4bc4-p9bns
82s         Normal   Scheduled           pod/builder-678474bf88-67fwt                         Successfully assigned turbo-engine-e2e/builder-678474bf88-67fwt to turbo-engine-e2e-control-plane
82s         Normal   Scheduled           pod/otel-collector-8584bc4d4c-qc9fb                  Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-qc9fb to turbo-engine-e2e-control-plane
82s         Normal   ScalingReplicaSet   deployment/jaeger                                    Scaled up replica set jaeger-54885dfdf from 0 to 1
82s         Normal   Scheduled           pod/turbo-engine-operator-7cd95f4bc4-p9bns           Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-p9bns to turbo-engine-e2e-control-plane
82s         Normal   ScalingReplicaSet   deployment/registry                                  Scaled up replica set registry-7d5f66bcd8 from 0 to 1
82s         Normal   SuccessfulCreate    replicaset/registry-7d5f66bcd8                       Created pod: registry-7d5f66bcd8-5lx4t
82s         Normal   Started             pod/envmanager-76c64c8cc9-4kvzt                      Container started
82s         Normal   SuccessfulCreate    replicaset/envmanager-76c64c8cc9                     Created pod: envmanager-76c64c8cc9-4kvzt
82s         Normal   Pulling             pod/jaeger-54885dfdf-676ng                           Pulling image "jaegertracing/all-in-one:1.54"
82s         Normal   Scheduled           pod/registry-7d5f66bcd8-5lx4t                        Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-5lx4t to turbo-engine-e2e-control-plane
82s         Normal   Scheduled           pod/envmanager-76c64c8cc9-4kvzt                      Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-4kvzt to turbo-engine-e2e-control-plane
82s         Normal   Pulled              pod/envmanager-76c64c8cc9-4kvzt                      Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
82s         Normal   Pulled              pod/builder-678474bf88-67fwt                         Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
82s         Normal   SuccessfulCreate    replicaset/jaeger-54885dfdf                          Created pod: jaeger-54885dfdf-676ng
82s         Normal   Scheduled           pod/jaeger-54885dfdf-676ng                           Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-676ng to turbo-engine-e2e-control-plane
82s         Normal   ScalingReplicaSet   deployment/envmanager                                Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
82s         Normal   Scheduled           pod/explorer-5465b84fd-cgvzb                         Successfully assigned turbo-engine-e2e/explorer-5465b84fd-cgvzb to turbo-engine-e2e-control-plane
82s         Normal   Pulled              pod/explorer-5465b84fd-cgvzb                         Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
82s         Normal   Created             pod/explorer-5465b84fd-cgvzb                         Container created
82s         Normal   SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                 Created pod: otel-collector-8584bc4d4c-qc9fb
82s         Normal   SuccessfulCreate    replicaset/explorer-5465b84fd                        Created pod: explorer-5465b84fd-cgvzb
82s         Normal   ScalingReplicaSet   deployment/explorer                                  Scaled up replica set explorer-5465b84fd from 0 to 1
82s         Normal   Scheduled           pod/gateway-586c64fdf5-j7fdz                         Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-j7fdz to turbo-engine-e2e-control-plane
82s         Normal   Pulled              pod/gateway-586c64fdf5-j7fdz                         Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
82s         Normal   Created             pod/gateway-586c64fdf5-j7fdz                         Container created
82s         Normal   SuccessfulCreate    replicaset/gateway-586c64fdf5                        Created pod: gateway-586c64fdf5-j7fdz
81s         Normal   Started             pod/turbo-engine-operator-7cd95f4bc4-p9bns           Container started
81s         Normal   Started             pod/explorer-5465b84fd-cgvzb                         Container started
81s         Normal   Created             pod/registry-7d5f66bcd8-5lx4t                        Container created
81s         Normal   Pulled              pod/registry-7d5f66bcd8-5lx4t                        Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
81s         Normal   Started             pod/registry-7d5f66bcd8-5lx4t                        Container started
81s         Normal   Started             pod/gateway-586c64fdf5-j7fdz                         Container started
81s         Normal   Pulled              pod/turbo-engine-operator-7cd95f4bc4-p9bns           Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
81s         Normal   Created             pod/turbo-engine-operator-7cd95f4bc4-p9bns           Container created
81s         Normal   Pulling             pod/otel-collector-8584bc4d4c-qc9fb                  Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
81s         Normal   Started             pod/console-78fbd5c84-g96k7                          Container started
80s         Normal   Pulled              pod/jaeger-54885dfdf-676ng                           Successfully pulled image "jaegertracing/all-in-one:1.54" in 1.226s (1.226s including waiting). Image size: 33344095 bytes.
80s         Normal   Created             pod/jaeger-54885dfdf-676ng                           Container created
80s         Normal   Started             pod/jaeger-54885dfdf-676ng                           Container started
78s         Normal   Pulled              pod/otel-collector-8584bc4d4c-qc9fb                  Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 2.097s (3.252s including waiting). Image size: 65128183 bytes.
78s         Normal   Created             pod/otel-collector-8584bc4d4c-qc9fb                  Container created
78s         Normal   Started             pod/otel-collector-8584bc4d4c-qc9fb                  Container started
35s         Normal   ScalingReplicaSet   deployment/deploy-petstore-api                       Scaled up replica set deploy-petstore-api-6b7b865c95 from 0 to 1
35s         Normal   Scheduled           pod/deploy-petstore-api-6b7b865c95-czkhm             Successfully assigned turbo-engine-e2e/deploy-petstore-api-6b7b865c95-czkhm to turbo-engine-e2e-control-plane
35s         Normal   SuccessfulCreate    replicaset/deploy-petstore-api-6b7b865c95            Created pod: deploy-petstore-api-6b7b865c95-czkhm
34s         Normal   SuccessfulCreate    replicaset/deploy-petstore-orchestrator-68fc6bd898   Created pod: deploy-petstore-orchestrator-68fc6bd898-6fgts
34s         Normal   Pulled              pod/deploy-petstore-orchestrator-68fc6bd898-6fgts    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
34s         Normal   Scheduled           pod/deploy-petstore-orchestrator-68fc6bd898-6fgts    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-68fc6bd898-6fgts to turbo-engine-e2e-control-plane
34s         Normal   Created             pod/deploy-petstore-orchestrator-68fc6bd898-6fgts    Container created
34s         Normal   Started             pod/deploy-petstore-orchestrator-68fc6bd898-6fgts    Container started
34s         Normal   Started             pod/deploy-petstore-api-6b7b865c95-czkhm             Container started
34s         Normal   Created             pod/deploy-petstore-api-6b7b865c95-czkhm             Container created
34s         Normal   Pulled              pod/deploy-petstore-api-6b7b865c95-czkhm             Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
34s         Normal   ScalingReplicaSet   deployment/deploy-petstore-orchestrator              Scaled up replica set deploy-petstore-orchestrator-68fc6bd898 from 0 to 1
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T21:16:53.97110674Z",
      "msg": "reconcile request received",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971132747Z",
      "msg": "starting reconciliation",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971149331Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.9711605Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971164769Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971169499Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971174323Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971184603Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.97118885Z",
      "msg": "reconciliation action",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.971224656Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.981711397Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.986880737Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.991340763Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:53.999289448Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:54.008554504Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:54.017884647Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:54.017947692Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T21:16:54.017982155Z",
      "msg": "reconciliation complete",
      "environment_id": "649d24a5c1cb164e8090fbe0f664ed49",
      "action": "reconciliation complete",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": "Running"
    }
  ],
  "count": 18
}
```

</details>

<details><summary>registry logs (6 lines)</summary>

```
{"time":"2026-02-21T21:16:07.292400822Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T21:16:53.958726242Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T21:16:53.9611552Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T21:17:10.816625955Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T21:17:19.082201365Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T21:17:23.219386776Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (4 lines)</summary>

```
{"time":"2026-02-21T21:16:06.943942645Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T21:16:21.944925956Z","level":"INFO","msg":"traces export: context deadline exceeded: rpc error: code = Unavailable desc = connection error: desc = \"transport: Error while dialing: dial tcp 10.96.80.15:4317: connect: connection refused\""}
{"time":"2026-02-21T21:16:53.966342205Z","level":"INFO","msg":"build created","build_id":"bld-1771708613966-1","environment_id":"649d24a5c1cb164e8090fbe0f664ed49"}
{"time":"2026-02-21T21:16:53.96661051Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771708613966-1"}
```

</details>

<details><summary>envmanager logs (2 lines)</summary>

```
{"time":"2026-02-21T21:16:06.969095793Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T21:16:53.96372576Z","level":"INFO","msg":"environment created","id":"649d24a5c1cb164e8090fbe0f664ed49","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (43 lines)</summary>

```
{"time":"2026-02-21T21:16:07.394572231Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T21:16:07.394753875Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T21:16:07.394767435Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T21:16:07.395346416Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T21:16:07.395395151Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T21:16:12.396964982Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:17.397470527Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:22.397437416Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:27.398028814Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:30.210741299Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T21:16:32.398385232Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:37.397479543Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:42.397524078Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:45.207807286Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T21:16:47.396649553Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:52.397160112Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:16:53.97110674Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","build_id":"bld-1771708613966-1"}
{"time":"2026-02-21T21:16:53.971132747Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","build_id":"bld-1771708613966-1","components":2}
{"time":"2026-02-21T21:16:53.971149331Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T21:16:53.9711605Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T21:16:53.971164769Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T21:16:53.971169499Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T21:16:53.971174323Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T21:16:53.971184603Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T21:16:53.97118885Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T21:16:53.971224656Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T21:16:53.981711397Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T21:16:53.986880737Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T21:16:53.991340763Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T21:16:53.999289448Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T21:16:54.008554504Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T21:16:54.017884647Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T21:16:54.017947692Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T21:16:54.017982155Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"649d24a5c1cb164e8090fbe0f664ed49","phase":"Running","actions":7}
{"time":"2026-02-21T21:16:57.397489916Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:17:00.207276313Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T21:17:02.398359904Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:17:07.396518386Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:17:12.400123207Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:17:15.208524485Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T21:17:17.397898709Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:17:22.399245082Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T21:17:27.397638078Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (10 lines)</summary>

```
[2m2026-02-21T21:16:07.097989Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T21:16:07.413932Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T21:16:08.612678Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T21:16:10.816987Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T21:16:15.007531Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T21:16:15.213385Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T21:16:30.211604Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T21:16:45.208591Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T21:17:00.207945Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T21:17:15.209354Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

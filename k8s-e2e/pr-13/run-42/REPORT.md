# K8s E2E Report

**Generated:** 2026-02-21T22:25:11Z

**ALL 16 TESTS PASSED**

```
00:00  Waiting for control plane deployments to roll out
00:00  Control plane ready
00:00  Setting up port-forwards
00:07  Port-forwards healthy
00:07  Running scenario: petstore-basic
00:46  Scenario petstore-basic: 14/14 passed
00:46  Tests complete: 16 passed, 0 failed
```

## Scenarios

### [petstore-basic: ALL 14 TESTS PASSED](./scenarios/petstore-basic/report.md)

4 screenshots | [traces](./traces.html)

## Platform Health

**Pods:** 11/11 running

<details><summary>Full resource list</summary>

```
NAME                                                READY   STATUS    RESTARTS   AGE   IP            NODE                             NOMINATED NODE   READINESS GATES
pod/builder-678474bf88-5cw9l                        1/1     Running   0          95s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-rckgs                         1/1     Running   0          95s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-799f56d44f-cmlcr            1/1     Running   0          39s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-56c56d6688-m6hzm   1/1     Running   0          39s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-qnbfm                     1/1     Running   0          95s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-cwgzh                        1/1     Running   0          95s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-5fqn9                        1/1     Running   0          95s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-4mqlc                          1/1     Running   0          95s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-tw422                 1/1     Running   0          94s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-lltng                       1/1     Running   0          94s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-82fnb          1/1     Running   0          94s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.141.242   <none>        8082/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.154.131   <none>        3000/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.46.127    <none>        8083/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.216.152   <none>        3001/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.245.200   <none>        8080/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.225.126   <none>        16686/TCP,4317/TCP   95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.38.16     <none>        4317/TCP,4318/TCP    95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.85.93     <none>        8081/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.110.90    <none>        8080/TCP             39s   app.kubernetes.io/instance=4e803023934523a366aad7716690351a,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.37.250    <none>        8080/TCP             39s   app.kubernetes.io/instance=4e803023934523a366aad7716690351a,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.86.193    <none>        8084/TCP             95s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           95s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           95s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           39s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=4e803023934523a366aad7716690351a,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           39s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=4e803023934523a366aad7716690351a,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           95s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           95s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           95s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           95s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           95s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           95s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           95s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                      DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                        1         1         1       95s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                         1         1         1       95s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-799f56d44f            1         1         1       39s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=4e803023934523a366aad7716690351a,app.kubernetes.io/name=petstore-api,pod-template-hash=799f56d44f
replicaset.apps/deploy-petstore-orchestrator-56c56d6688   1         1         1       39s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=4e803023934523a366aad7716690351a,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=56c56d6688
replicaset.apps/envmanager-76c64c8cc9                     1         1         1       95s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                        1         1         1       95s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                        1         1         1       95s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                          1         1         1       95s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                 1         1         1       94s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                       1         1         1       94s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4          1         1         1       94s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 5  **builder:** 34  **envmanager:** 18  **gateway:** 6  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (70 lines)</summary>

```
LAST SEEN   TYPE      REASON              OBJECT                                               MESSAGE
96s         Normal    Scheduled           pod/envmanager-76c64c8cc9-qnbfm                      Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-qnbfm to turbo-engine-e2e-control-plane
96s         Normal    Scheduled           pod/builder-678474bf88-5cw9l                         Successfully assigned turbo-engine-e2e/builder-678474bf88-5cw9l to turbo-engine-e2e-control-plane
96s         Normal    ScalingReplicaSet   deployment/jaeger                                    Scaled up replica set jaeger-54885dfdf from 0 to 1
96s         Normal    SuccessfulCreate    replicaset/jaeger-54885dfdf                          Created pod: jaeger-54885dfdf-4mqlc
96s         Normal    SuccessfulCreate    replicaset/builder-678474bf88                        Created pod: builder-678474bf88-5cw9l
96s         Normal    ScalingReplicaSet   deployment/builder                                   Scaled up replica set builder-678474bf88 from 0 to 1
96s         Normal    Scheduled           pod/console-78fbd5c84-rckgs                          Successfully assigned turbo-engine-e2e/console-78fbd5c84-rckgs to turbo-engine-e2e-control-plane
96s         Normal    Scheduled           pod/jaeger-54885dfdf-4mqlc                           Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-4mqlc to turbo-engine-e2e-control-plane
96s         Normal    ScalingReplicaSet   deployment/gateway                                   Scaled up replica set gateway-586c64fdf5 from 0 to 1
96s         Normal    SuccessfulCreate    replicaset/gateway-586c64fdf5                        Created pod: gateway-586c64fdf5-5fqn9
96s         Normal    SuccessfulCreate    replicaset/console-78fbd5c84                         Created pod: console-78fbd5c84-rckgs
96s         Normal    ScalingReplicaSet   deployment/console                                   Scaled up replica set console-78fbd5c84 from 0 to 1
96s         Normal    Scheduled           pod/gateway-586c64fdf5-5fqn9                         Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-5fqn9 to turbo-engine-e2e-control-plane
96s         Normal    ScalingReplicaSet   deployment/explorer                                  Scaled up replica set explorer-5465b84fd from 0 to 1
96s         Normal    SuccessfulCreate    replicaset/explorer-5465b84fd                        Created pod: explorer-5465b84fd-cwgzh
96s         Normal    Scheduled           pod/explorer-5465b84fd-cwgzh                         Successfully assigned turbo-engine-e2e/explorer-5465b84fd-cwgzh to turbo-engine-e2e-control-plane
96s         Normal    ScalingReplicaSet   deployment/envmanager                                Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
96s         Normal    SuccessfulCreate    replicaset/envmanager-76c64c8cc9                     Created pod: envmanager-76c64c8cc9-qnbfm
95s         Normal    Pulling             pod/otel-collector-8584bc4d4c-tw422                  Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
95s         Normal    Pulled              pod/console-78fbd5c84-rckgs                          Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
95s         Normal    ScalingReplicaSet   deployment/turbo-engine-operator                     Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
95s         Normal    SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4          Created pod: turbo-engine-operator-7cd95f4bc4-82fnb
95s         Normal    Created             pod/turbo-engine-operator-7cd95f4bc4-82fnb           Container created
95s         Normal    Pulled              pod/turbo-engine-operator-7cd95f4bc4-82fnb           Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
95s         Normal    Scheduled           pod/turbo-engine-operator-7cd95f4bc4-82fnb           Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-82fnb to turbo-engine-e2e-control-plane
95s         Normal    Pulled              pod/envmanager-76c64c8cc9-qnbfm                      Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
95s         Normal    Created             pod/envmanager-76c64c8cc9-qnbfm                      Container created
95s         Normal    Started             pod/envmanager-76c64c8cc9-qnbfm                      Container started
95s         Normal    ScalingReplicaSet   deployment/registry                                  Scaled up replica set registry-7d5f66bcd8 from 0 to 1
95s         Normal    SuccessfulCreate    replicaset/registry-7d5f66bcd8                       Created pod: registry-7d5f66bcd8-lltng
95s         Normal    Started             pod/registry-7d5f66bcd8-lltng                        Container started
95s         Normal    Pulled              pod/explorer-5465b84fd-cwgzh                         Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
95s         Normal    Created             pod/explorer-5465b84fd-cwgzh                         Container created
95s         Normal    Created             pod/registry-7d5f66bcd8-lltng                        Container created
95s         Normal    Pulled              pod/registry-7d5f66bcd8-lltng                        Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
95s         Normal    Scheduled           pod/registry-7d5f66bcd8-lltng                        Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-lltng to turbo-engine-e2e-control-plane
95s         Normal    ScalingReplicaSet   deployment/otel-collector                            Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
95s         Normal    Pulled              pod/gateway-586c64fdf5-5fqn9                         Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
95s         Normal    Created             pod/gateway-586c64fdf5-5fqn9                         Container created
95s         Normal    Started             pod/gateway-586c64fdf5-5fqn9                         Container started
95s         Normal    SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                 Created pod: otel-collector-8584bc4d4c-tw422
95s         Normal    Pulled              pod/builder-678474bf88-5cw9l                         Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
95s         Normal    Created             pod/console-78fbd5c84-rckgs                          Container created
95s         Normal    Scheduled           pod/otel-collector-8584bc4d4c-tw422                  Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-tw422 to turbo-engine-e2e-control-plane
95s         Normal    Pulling             pod/jaeger-54885dfdf-4mqlc                           Pulling image "jaegertracing/all-in-one:1.54"
95s         Normal    Created             pod/builder-678474bf88-5cw9l                         Container created
95s         Normal    Started             pod/builder-678474bf88-5cw9l                         Container started
94s         Normal    Started             pod/explorer-5465b84fd-cwgzh                         Container started
94s         Normal    Created             pod/jaeger-54885dfdf-4mqlc                           Container created
94s         Normal    Pulled              pod/jaeger-54885dfdf-4mqlc                           Successfully pulled image "jaegertracing/all-in-one:1.54" in 1.225s (1.225s including waiting). Image size: 33344095 bytes.
94s         Normal    Started             pod/turbo-engine-operator-7cd95f4bc4-82fnb           Container started
94s         Normal    Started             pod/console-78fbd5c84-rckgs                          Container started
93s         Normal    Started             pod/jaeger-54885dfdf-4mqlc                           Container started
92s         Normal    Pulled              pod/otel-collector-8584bc4d4c-tw422                  Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 1.777s (2.941s including waiting). Image size: 65128183 bytes.
92s         Normal    Created             pod/otel-collector-8584bc4d4c-tw422                  Container created
92s         Warning   Unhealthy           pod/gateway-586c64fdf5-5fqn9                         Readiness probe failed: Get "http://10.244.0.9:8080/healthz": dial tcp 10.244.0.9:8080: connect: connection refused
91s         Normal    Started             pod/otel-collector-8584bc4d4c-tw422                  Container started
40s         Normal    ScalingReplicaSet   deployment/deploy-petstore-api                       Scaled up replica set deploy-petstore-api-799f56d44f from 0 to 1
40s         Normal    SuccessfulCreate    replicaset/deploy-petstore-api-799f56d44f            Created pod: deploy-petstore-api-799f56d44f-cmlcr
40s         Normal    Scheduled           pod/deploy-petstore-api-799f56d44f-cmlcr             Successfully assigned turbo-engine-e2e/deploy-petstore-api-799f56d44f-cmlcr to turbo-engine-e2e-control-plane
40s         Normal    Scheduled           pod/deploy-petstore-orchestrator-56c56d6688-m6hzm    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-56c56d6688-m6hzm to turbo-engine-e2e-control-plane
40s         Normal    ScalingReplicaSet   deployment/deploy-petstore-orchestrator              Scaled up replica set deploy-petstore-orchestrator-56c56d6688 from 0 to 1
40s         Normal    SuccessfulCreate    replicaset/deploy-petstore-orchestrator-56c56d6688   Created pod: deploy-petstore-orchestrator-56c56d6688-m6hzm
39s         Normal    Created             pod/deploy-petstore-api-799f56d44f-cmlcr             Container created
39s         Normal    Pulled              pod/deploy-petstore-api-799f56d44f-cmlcr             Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
39s         Normal    Started             pod/deploy-petstore-api-799f56d44f-cmlcr             Container started
39s         Normal    Pulled              pod/deploy-petstore-orchestrator-56c56d6688-m6hzm    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
39s         Normal    Started             pod/deploy-petstore-orchestrator-56c56d6688-m6hzm    Container started
39s         Normal    Created             pod/deploy-petstore-orchestrator-56c56d6688-m6hzm    Container created
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T22:24:28.924689522Z",
      "msg": "reconcile request received",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924722554Z",
      "msg": "starting reconciliation",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924738674Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924759933Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924767247Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924772687Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924778427Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924783487Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924789007Z",
      "msg": "reconciliation action",
      "environment_id": "4e803023934523a366aad7716690351a",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.924795799Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.934963209Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.942008346Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.951534075Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.956797751Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.967895835Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.976761009Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.976783951Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T22:24:28.978029021Z",
      "msg": "reconciliation complete",
      "environment_id": "4e803023934523a366aad7716690351a",
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
{"time":"2026-02-21T22:23:33.971012683Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T22:24:28.907834474Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T22:24:28.911213419Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T22:24:50.908611268Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T22:24:59.260678546Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T22:25:03.46071907Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (4 lines)</summary>

```
{"time":"2026-02-21T22:23:33.710111866Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T22:23:48.709752354Z","level":"INFO","msg":"traces export: context deadline exceeded: rpc error: code = Unavailable desc = connection error: desc = \"transport: Error while dialing: dial tcp 10.96.38.16:4317: connect: connection refused\""}
{"time":"2026-02-21T22:24:28.91799492Z","level":"INFO","msg":"build created","build_id":"bld-1771712668917-1","environment_id":"4e803023934523a366aad7716690351a"}
{"time":"2026-02-21T22:24:28.918230285Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771712668917-1"}
```

</details>

<details><summary>envmanager logs (3 lines)</summary>

```
{"time":"2026-02-21T22:23:33.703564171Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T22:23:48.705063254Z","level":"INFO","msg":"traces export: context deadline exceeded: rpc error: code = Unavailable desc = connection error: desc = \"transport: Error while dialing: dial tcp 10.96.38.16:4317: connect: connection refused\""}
{"time":"2026-02-21T22:24:28.914620331Z","level":"INFO","msg":"environment created","id":"4e803023934523a366aad7716690351a","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (46 lines)</summary>

```
{"time":"2026-02-21T22:23:34.188891239Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T22:23:34.189063168Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T22:23:34.189079709Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T22:23:34.189570662Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T22:23:34.189579419Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T22:23:39.191302277Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:23:44.192246367Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:23:49.191765014Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:23:54.192702287Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:23:56.943427463Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T22:23:59.19235253Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:04.191108563Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:09.193595091Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:11.939838624Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T22:24:14.192316729Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:19.191203932Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:24.195412821Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:26.936393191Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T22:24:28.924689522Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"4e803023934523a366aad7716690351a","build_id":"bld-1771712668917-1"}
{"time":"2026-02-21T22:24:28.924722554Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","build_id":"bld-1771712668917-1","components":2}
{"time":"2026-02-21T22:24:28.924738674Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T22:24:28.924759933Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T22:24:28.924767247Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T22:24:28.924772687Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T22:24:28.924778427Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T22:24:28.924783487Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T22:24:28.924789007Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T22:24:28.924795799Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T22:24:28.934963209Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T22:24:28.942008346Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T22:24:28.951534075Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T22:24:28.956797751Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T22:24:28.967895835Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T22:24:28.976761009Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T22:24:28.976783951Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T22:24:28.978029021Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"4e803023934523a366aad7716690351a","phase":"Running","actions":7}
{"time":"2026-02-21T22:24:29.190904698Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:34.191025153Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:39.19295902Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:41.93453892Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T22:24:44.192504156Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:49.192371019Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:54.192992171Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:24:56.934280416Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T22:24:59.191347238Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T22:25:04.191382268Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (11 lines)</summary>

```
[2m2026-02-21T22:23:33.836623Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T22:23:34.141587Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T22:23:35.338568Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T22:23:37.538381Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T22:23:41.735923Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T22:23:41.939219Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T22:23:56.944375Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T22:24:11.940567Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T22:24:26.937096Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T22:24:41.935278Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T22:24:56.935044Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

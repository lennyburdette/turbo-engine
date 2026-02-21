# K8s E2E Report

**Generated:** 2026-02-21T23:27:53Z

**ALL 16 TESTS PASSED**

```
00:00  Waiting for control plane deployments to roll out
00:00  Control plane ready
00:00  Setting up port-forwards
00:07  Port-forwards healthy
00:07  Running scenario: petstore-basic
00:35  Scenario petstore-basic: 14/14 passed
00:35  Tests complete: 16 passed, 0 failed
```

## Scenarios

### [petstore-basic: ALL 14 TESTS PASSED](./scenarios/petstore-basic/report.md)

4 screenshots | [traces](./traces.html)

## Platform Health

**Pods:** 11/11 running

<details><summary>Full resource list</summary>

```
NAME                                               READY   STATUS    RESTARTS   AGE   IP            NODE                             NOMINATED NODE   READINESS GATES
pod/builder-678474bf88-xqwlg                       1/1     Running   0          79s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-znxwl                        1/1     Running   0          79s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-7ff8b589bc-bq4ws           1/1     Running   0          28s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-7bbc86554-q8vtt   1/1     Running   0          28s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-fm8bp                    1/1     Running   0          79s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-kgs5d                       1/1     Running   0          79s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-tq58r                       1/1     Running   0          79s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-rwjwg                         1/1     Running   0          79s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-mb4lx                1/1     Running   0          79s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-86t6b                      1/1     Running   0          79s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-lfwqs         1/1     Running   0          79s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.207.249   <none>        8082/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.201.116   <none>        3000/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.224.172   <none>        8083/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.79.217    <none>        3001/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.18.116    <none>        8080/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.226.135   <none>        16686/TCP,4317/TCP   80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.94.173    <none>        4317/TCP,4318/TCP    80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.125.59    <none>        8081/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.178.180   <none>        8080/TCP             28s   app.kubernetes.io/instance=8ec8c1a6080e0ec5d2235e797fb562bb,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.165.16    <none>        8080/TCP             28s   app.kubernetes.io/instance=8ec8c1a6080e0ec5d2235e797fb562bb,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.2.144     <none>        8084/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           79s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           79s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           28s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=8ec8c1a6080e0ec5d2235e797fb562bb,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           28s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=8ec8c1a6080e0ec5d2235e797fb562bb,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           79s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           79s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           79s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           79s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           79s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           79s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           79s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                     DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                       1         1         1       79s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                        1         1         1       79s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-7ff8b589bc           1         1         1       28s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=8ec8c1a6080e0ec5d2235e797fb562bb,app.kubernetes.io/name=petstore-api,pod-template-hash=7ff8b589bc
replicaset.apps/deploy-petstore-orchestrator-7bbc86554   1         1         1       28s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=8ec8c1a6080e0ec5d2235e797fb562bb,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=7bbc86554
replicaset.apps/envmanager-76c64c8cc9                    1         1         1       79s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                       1         1         1       79s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                       1         1         1       79s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                         1         1         1       79s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                1         1         1       79s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                      1         1         1       79s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4         1         1         1       79s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 5  **builder:** 27  **envmanager:** 16  **gateway:** 4  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (69 lines)</summary>

```
LAST SEEN   TYPE     REASON              OBJECT                                              MESSAGE
80s         Normal   Created             pod/envmanager-76c64c8cc9-fm8bp                     Container created
80s         Normal   ScalingReplicaSet   deployment/gateway                                  Scaled up replica set gateway-586c64fdf5 from 0 to 1
80s         Normal   Created             pod/builder-678474bf88-xqwlg                        Container created
80s         Normal   ScalingReplicaSet   deployment/otel-collector                           Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
80s         Normal   SuccessfulCreate    replicaset/builder-678474bf88                       Created pod: builder-678474bf88-xqwlg
80s         Normal   ScalingReplicaSet   deployment/builder                                  Scaled up replica set builder-678474bf88 from 0 to 1
80s         Normal   Scheduled           pod/console-78fbd5c84-znxwl                         Successfully assigned turbo-engine-e2e/console-78fbd5c84-znxwl to turbo-engine-e2e-control-plane
80s         Normal   Pulled              pod/console-78fbd5c84-znxwl                         Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/console-78fbd5c84-znxwl                         Container created
80s         Normal   Scheduled           pod/builder-678474bf88-xqwlg                        Successfully assigned turbo-engine-e2e/builder-678474bf88-xqwlg to turbo-engine-e2e-control-plane
80s         Normal   SuccessfulCreate    replicaset/console-78fbd5c84                        Created pod: console-78fbd5c84-znxwl
80s         Normal   ScalingReplicaSet   deployment/console                                  Scaled up replica set console-78fbd5c84 from 0 to 1
80s         Normal   ScalingReplicaSet   deployment/turbo-engine-operator                    Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
80s         Normal   SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4         Created pod: turbo-engine-operator-7cd95f4bc4-lfwqs
80s         Normal   Scheduled           pod/otel-collector-8584bc4d4c-mb4lx                 Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-mb4lx to turbo-engine-e2e-control-plane
80s         Normal   ScalingReplicaSet   deployment/jaeger                                   Scaled up replica set jaeger-54885dfdf from 0 to 1
80s         Normal   Pulling             pod/jaeger-54885dfdf-rwjwg                          Pulling image "jaegertracing/all-in-one:1.54"
80s         Normal   Scheduled           pod/turbo-engine-operator-7cd95f4bc4-lfwqs          Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-lfwqs to turbo-engine-e2e-control-plane
80s         Normal   ScalingReplicaSet   deployment/registry                                 Scaled up replica set registry-7d5f66bcd8 from 0 to 1
80s         Normal   SuccessfulCreate    replicaset/registry-7d5f66bcd8                      Created pod: registry-7d5f66bcd8-86t6b
80s         Normal   Scheduled           pod/jaeger-54885dfdf-rwjwg                          Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-rwjwg to turbo-engine-e2e-control-plane
80s         Normal   SuccessfulCreate    replicaset/envmanager-76c64c8cc9                    Created pod: envmanager-76c64c8cc9-fm8bp
80s         Normal   SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                Created pod: otel-collector-8584bc4d4c-mb4lx
80s         Normal   Scheduled           pod/registry-7d5f66bcd8-86t6b                       Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-86t6b to turbo-engine-e2e-control-plane
80s         Normal   Scheduled           pod/envmanager-76c64c8cc9-fm8bp                     Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-fm8bp to turbo-engine-e2e-control-plane
80s         Normal   Pulled              pod/envmanager-76c64c8cc9-fm8bp                     Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
80s         Normal   Pulled              pod/builder-678474bf88-xqwlg                        Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
80s         Normal   SuccessfulCreate    replicaset/jaeger-54885dfdf                         Created pod: jaeger-54885dfdf-rwjwg
80s         Normal   SuccessfulCreate    replicaset/gateway-586c64fdf5                       Created pod: gateway-586c64fdf5-tq58r
80s         Normal   ScalingReplicaSet   deployment/envmanager                               Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
80s         Normal   Scheduled           pod/explorer-5465b84fd-kgs5d                        Successfully assigned turbo-engine-e2e/explorer-5465b84fd-kgs5d to turbo-engine-e2e-control-plane
80s         Normal   Created             pod/gateway-586c64fdf5-tq58r                        Container created
80s         Normal   Pulled              pod/gateway-586c64fdf5-tq58r                        Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
80s         Normal   Scheduled           pod/gateway-586c64fdf5-tq58r                        Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-tq58r to turbo-engine-e2e-control-plane
80s         Normal   SuccessfulCreate    replicaset/explorer-5465b84fd                       Created pod: explorer-5465b84fd-kgs5d
80s         Normal   ScalingReplicaSet   deployment/explorer                                 Scaled up replica set explorer-5465b84fd from 0 to 1
79s         Normal   Created             pod/turbo-engine-operator-7cd95f4bc4-lfwqs          Container created
79s         Normal   Started             pod/turbo-engine-operator-7cd95f4bc4-lfwqs          Container started
79s         Normal   Pulled              pod/explorer-5465b84fd-kgs5d                        Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
79s         Normal   Started             pod/gateway-586c64fdf5-tq58r                        Container started
79s         Normal   Created             pod/registry-7d5f66bcd8-86t6b                       Container created
79s         Normal   Pulled              pod/registry-7d5f66bcd8-86t6b                       Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
79s         Normal   Started             pod/registry-7d5f66bcd8-86t6b                       Container started
79s         Normal   Started             pod/explorer-5465b84fd-kgs5d                        Container started
79s         Normal   Created             pod/explorer-5465b84fd-kgs5d                        Container created
79s         Normal   Started             pod/builder-678474bf88-xqwlg                        Container started
79s         Normal   Started             pod/console-78fbd5c84-znxwl                         Container started
79s         Normal   Started             pod/envmanager-76c64c8cc9-fm8bp                     Container started
79s         Normal   Pulled              pod/turbo-engine-operator-7cd95f4bc4-lfwqs          Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
79s         Normal   Pulling             pod/otel-collector-8584bc4d4c-mb4lx                 Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
78s         Normal   Started             pod/jaeger-54885dfdf-rwjwg                          Container started
78s         Normal   Created             pod/jaeger-54885dfdf-rwjwg                          Container created
78s         Normal   Pulled              pod/jaeger-54885dfdf-rwjwg                          Successfully pulled image "jaegertracing/all-in-one:1.54" in 1.308s (1.309s including waiting). Image size: 33344095 bytes.
76s         Normal   Pulled              pod/otel-collector-8584bc4d4c-mb4lx                 Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 2.478s (3.694s including waiting). Image size: 65128183 bytes.
76s         Normal   Created             pod/otel-collector-8584bc4d4c-mb4lx                 Container created
75s         Normal   Started             pod/otel-collector-8584bc4d4c-mb4lx                 Container started
29s         Normal   SuccessfulCreate    replicaset/deploy-petstore-api-7ff8b589bc           Created pod: deploy-petstore-api-7ff8b589bc-bq4ws
29s         Normal   SuccessfulCreate    replicaset/deploy-petstore-orchestrator-7bbc86554   Created pod: deploy-petstore-orchestrator-7bbc86554-q8vtt
29s         Normal   Scheduled           pod/deploy-petstore-orchestrator-7bbc86554-q8vtt    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-7bbc86554-q8vtt to turbo-engine-e2e-control-plane
29s         Normal   ScalingReplicaSet   deployment/deploy-petstore-api                      Scaled up replica set deploy-petstore-api-7ff8b589bc from 0 to 1
29s         Normal   ScalingReplicaSet   deployment/deploy-petstore-orchestrator             Scaled up replica set deploy-petstore-orchestrator-7bbc86554 from 0 to 1
29s         Normal   Scheduled           pod/deploy-petstore-api-7ff8b589bc-bq4ws            Successfully assigned turbo-engine-e2e/deploy-petstore-api-7ff8b589bc-bq4ws to turbo-engine-e2e-control-plane
28s         Normal   Started             pod/deploy-petstore-orchestrator-7bbc86554-q8vtt    Container started
28s         Normal   Created             pod/deploy-petstore-orchestrator-7bbc86554-q8vtt    Container created
28s         Normal   Pulled              pod/deploy-petstore-orchestrator-7bbc86554-q8vtt    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
28s         Normal   Started             pod/deploy-petstore-api-7ff8b589bc-bq4ws            Container started
28s         Normal   Created             pod/deploy-petstore-api-7ff8b589bc-bq4ws            Container created
28s         Normal   Pulled              pod/deploy-petstore-api-7ff8b589bc-bq4ws            Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T23:27:20.586299068Z",
      "msg": "reconcile request received",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586328573Z",
      "msg": "starting reconciliation",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586350715Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586365152Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586371043Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586376182Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586381542Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586386552Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586415766Z",
      "msg": "reconciliation action",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.586423481Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.596855596Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.602523346Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.606850227Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.614454768Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.628202033Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.645573213Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.645643695Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:27:20.645668161Z",
      "msg": "reconciliation complete",
      "environment_id": "8ec8c1a6080e0ec5d2235e797fb562bb",
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
{"time":"2026-02-21T23:26:30.345964215Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T23:27:20.569648419Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T23:27:20.572772832Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T23:27:32.064802414Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T23:27:40.629029279Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T23:27:44.81335081Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (3 lines)</summary>

```
{"time":"2026-02-21T23:26:30.082225725Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T23:27:20.579703992Z","level":"INFO","msg":"build created","build_id":"bld-1771716440579-1","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb"}
{"time":"2026-02-21T23:27:20.579910954Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771716440579-1"}
```

</details>

<details><summary>envmanager logs (2 lines)</summary>

```
{"time":"2026-02-21T23:26:30.081865776Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T23:27:20.576224079Z","level":"INFO","msg":"environment created","id":"8ec8c1a6080e0ec5d2235e797fb562bb","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (42 lines)</summary>

```
{"time":"2026-02-21T23:26:30.445313102Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T23:26:30.445778231Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T23:26:30.445794481Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T23:26:30.447067357Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T23:26:30.447326442Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T23:26:35.448954856Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.207.249:8082: connect: connection refused"}
{"time":"2026-02-21T23:26:40.452912056Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.207.249:8082: connect: connection refused"}
{"time":"2026-02-21T23:26:45.449510266Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:26:50.452975283Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:26:53.376833008Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T23:26:55.450704757Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:00.449748738Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:05.452174999Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:08.371211911Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T23:27:10.449657065Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:15.448877003Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:20.449353638Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:20.586299068Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","build_id":"bld-1771716440579-1"}
{"time":"2026-02-21T23:27:20.586328573Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","build_id":"bld-1771716440579-1","components":2}
{"time":"2026-02-21T23:27:20.586350715Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T23:27:20.586365152Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T23:27:20.586371043Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T23:27:20.586376182Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T23:27:20.586381542Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T23:27:20.586386552Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T23:27:20.586415766Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T23:27:20.586423481Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T23:27:20.596855596Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T23:27:20.602523346Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T23:27:20.606850227Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T23:27:20.614454768Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T23:27:20.628202033Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T23:27:20.645573213Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T23:27:20.645643695Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T23:27:20.645668161Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"8ec8c1a6080e0ec5d2235e797fb562bb","phase":"Running","actions":7}
{"time":"2026-02-21T23:27:23.360520201Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T23:27:25.449645259Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:30.449656879Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:35.451726228Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:38.361108109Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T23:27:40.449941591Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:27:45.448722831Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (10 lines)</summary>

```
[2m2026-02-21T23:26:30.182736Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T23:26:30.470502Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T23:26:31.666651Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T23:26:33.959710Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T23:26:38.162849Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T23:26:38.367485Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T23:26:53.418138Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T23:27:08.372137Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T23:27:23.361322Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T23:27:38.361981Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

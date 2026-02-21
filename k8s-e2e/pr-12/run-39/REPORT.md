# K8s E2E Report

**Generated:** 2026-02-21T20:11:20Z

**ALL 16 TESTS PASSED**

```
00:00  Waiting for control plane deployments to roll out
00:00  Control plane ready
00:00  Setting up port-forwards
00:07  Port-forwards healthy
00:07  Running scenario: petstore-basic
00:45  Scenario petstore-basic: 14/14 passed
00:45  Tests complete: 16 passed, 0 failed
```

## Scenarios

### [petstore-basic: ALL 14 TESTS PASSED](./scenarios/petstore-basic/report.md)

4 screenshots | [traces](./traces.html)

## Platform Health

**Pods:** 11/11 running

<details><summary>Full resource list</summary>

```
NAME                                                READY   STATUS    RESTARTS   AGE   IP            NODE                             NOMINATED NODE   READINESS GATES
pod/builder-678474bf88-45tng                        1/1     Running   0          93s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-p5krw                         1/1     Running   0          93s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-74768bbfdf-b94hx            1/1     Running   0          38s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-59d957fb64-m9ndz   1/1     Running   0          38s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-prs2q                     1/1     Running   0          93s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-6mcw6                        1/1     Running   0          93s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-9v7js                        1/1     Running   0          93s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-gd6hr                          1/1     Running   0          93s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-mxg7q                 1/1     Running   0          93s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-q7vp2                       1/1     Running   0          93s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-fr85z          1/1     Running   0          93s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.145.13    <none>        8082/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.103.197   <none>        3000/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.251.181   <none>        8083/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.114.151   <none>        3001/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.19.139    <none>        8080/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.97.115    <none>        16686/TCP,4317/TCP   93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.212.242   <none>        4317/TCP,4318/TCP    93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.152.139   <none>        8081/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.17.71     <none>        8080/TCP             38s   app.kubernetes.io/instance=e8b7a268e9827524482ec45ad7d0665b,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.167.4     <none>        8080/TCP             38s   app.kubernetes.io/instance=e8b7a268e9827524482ec45ad7d0665b,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.39.132    <none>        8084/TCP             93s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           93s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           93s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           38s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=e8b7a268e9827524482ec45ad7d0665b,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           38s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=e8b7a268e9827524482ec45ad7d0665b,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           93s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           93s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           93s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           93s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           93s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           93s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           93s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                      DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                        1         1         1       93s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                         1         1         1       93s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-74768bbfdf            1         1         1       38s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=e8b7a268e9827524482ec45ad7d0665b,app.kubernetes.io/name=petstore-api,pod-template-hash=74768bbfdf
replicaset.apps/deploy-petstore-orchestrator-59d957fb64   1         1         1       38s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=e8b7a268e9827524482ec45ad7d0665b,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=59d957fb64
replicaset.apps/envmanager-76c64c8cc9                     1         1         1       93s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                        1         1         1       93s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                        1         1         1       93s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                          1         1         1       93s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                 1         1         1       93s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                       1         1         1       93s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4          1         1         1       93s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 5  **builder:** 33  **envmanager:** 18  **gateway:** 6  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (69 lines)</summary>

```
LAST SEEN   TYPE     REASON              OBJECT                                               MESSAGE
94s         Normal   ScalingReplicaSet   deployment/turbo-engine-operator                     Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
94s         Normal   Scheduled           pod/envmanager-76c64c8cc9-prs2q                      Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-prs2q to turbo-engine-e2e-control-plane
94s         Normal   Scheduled           pod/builder-678474bf88-45tng                         Successfully assigned turbo-engine-e2e/builder-678474bf88-45tng to turbo-engine-e2e-control-plane
94s         Normal   Scheduled           pod/otel-collector-8584bc4d4c-mxg7q                  Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-mxg7q to turbo-engine-e2e-control-plane
94s         Normal   SuccessfulCreate    replicaset/builder-678474bf88                        Created pod: builder-678474bf88-45tng
94s         Normal   ScalingReplicaSet   deployment/builder                                   Scaled up replica set builder-678474bf88 from 0 to 1
94s         Normal   Scheduled           pod/console-78fbd5c84-p5krw                          Successfully assigned turbo-engine-e2e/console-78fbd5c84-p5krw to turbo-engine-e2e-control-plane
94s         Normal   ScalingReplicaSet   deployment/jaeger                                    Scaled up replica set jaeger-54885dfdf from 0 to 1
94s         Normal   SuccessfulCreate    replicaset/jaeger-54885dfdf                          Created pod: jaeger-54885dfdf-gd6hr
94s         Normal   Scheduled           pod/jaeger-54885dfdf-gd6hr                           Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-gd6hr to turbo-engine-e2e-control-plane
94s         Normal   SuccessfulCreate    replicaset/console-78fbd5c84                         Created pod: console-78fbd5c84-p5krw
94s         Normal   ScalingReplicaSet   deployment/gateway                                   Scaled up replica set gateway-586c64fdf5 from 0 to 1
94s         Normal   ScalingReplicaSet   deployment/otel-collector                            Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
94s         Normal   SuccessfulCreate    replicaset/envmanager-76c64c8cc9                     Created pod: envmanager-76c64c8cc9-prs2q
94s         Normal   ScalingReplicaSet   deployment/console                                   Scaled up replica set console-78fbd5c84 from 0 to 1
94s         Normal   SuccessfulCreate    replicaset/gateway-586c64fdf5                        Created pod: gateway-586c64fdf5-9v7js
94s         Normal   Scheduled           pod/gateway-586c64fdf5-9v7js                         Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-9v7js to turbo-engine-e2e-control-plane
94s         Normal   Scheduled           pod/turbo-engine-operator-7cd95f4bc4-fr85z           Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-fr85z to turbo-engine-e2e-control-plane
94s         Normal   ScalingReplicaSet   deployment/registry                                  Scaled up replica set registry-7d5f66bcd8 from 0 to 1
94s         Normal   SuccessfulCreate    replicaset/registry-7d5f66bcd8                       Created pod: registry-7d5f66bcd8-q7vp2
94s         Normal   ScalingReplicaSet   deployment/explorer                                  Scaled up replica set explorer-5465b84fd from 0 to 1
94s         Normal   SuccessfulCreate    replicaset/explorer-5465b84fd                        Created pod: explorer-5465b84fd-6mcw6
94s         Normal   Scheduled           pod/explorer-5465b84fd-6mcw6                         Successfully assigned turbo-engine-e2e/explorer-5465b84fd-6mcw6 to turbo-engine-e2e-control-plane
94s         Normal   Scheduled           pod/registry-7d5f66bcd8-q7vp2                        Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-q7vp2 to turbo-engine-e2e-control-plane
94s         Normal   SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4          Created pod: turbo-engine-operator-7cd95f4bc4-fr85z
94s         Normal   ScalingReplicaSet   deployment/envmanager                                Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
94s         Normal   SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                 Created pod: otel-collector-8584bc4d4c-mxg7q
93s         Normal   Created             pod/envmanager-76c64c8cc9-prs2q                      Container created
93s         Normal   Created             pod/turbo-engine-operator-7cd95f4bc4-fr85z           Container created
93s         Normal   Pulled              pod/envmanager-76c64c8cc9-prs2q                      Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
93s         Normal   Pulled              pod/registry-7d5f66bcd8-q7vp2                        Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
93s         Normal   Pulled              pod/explorer-5465b84fd-6mcw6                         Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
93s         Normal   Created             pod/explorer-5465b84fd-6mcw6                         Container created
93s         Normal   Started             pod/explorer-5465b84fd-6mcw6                         Container started
93s         Normal   Created             pod/registry-7d5f66bcd8-q7vp2                        Container created
93s         Normal   Started             pod/registry-7d5f66bcd8-q7vp2                        Container started
93s         Normal   Pulled              pod/turbo-engine-operator-7cd95f4bc4-fr85z           Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
93s         Normal   Pulled              pod/gateway-586c64fdf5-9v7js                         Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
93s         Normal   Created             pod/gateway-586c64fdf5-9v7js                         Container created
93s         Normal   Started             pod/gateway-586c64fdf5-9v7js                         Container started
93s         Normal   Started             pod/envmanager-76c64c8cc9-prs2q                      Container started
93s         Normal   Started             pod/turbo-engine-operator-7cd95f4bc4-fr85z           Container started
93s         Normal   Started             pod/console-78fbd5c84-p5krw                          Container started
93s         Normal   Pulling             pod/jaeger-54885dfdf-gd6hr                           Pulling image "jaegertracing/all-in-one:1.54"
93s         Normal   Pulled              pod/builder-678474bf88-45tng                         Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
93s         Normal   Created             pod/builder-678474bf88-45tng                         Container created
93s         Normal   Pulling             pod/otel-collector-8584bc4d4c-mxg7q                  Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
93s         Normal   Created             pod/console-78fbd5c84-p5krw                          Container created
93s         Normal   Pulled              pod/console-78fbd5c84-p5krw                          Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
93s         Normal   Started             pod/builder-678474bf88-45tng                         Container started
92s         Normal   Created             pod/jaeger-54885dfdf-gd6hr                           Container created
92s         Normal   Pulled              pod/jaeger-54885dfdf-gd6hr                           Successfully pulled image "jaegertracing/all-in-one:1.54" in 1.404s (1.404s including waiting). Image size: 33344095 bytes.
91s         Normal   Started             pod/jaeger-54885dfdf-gd6hr                           Container started
90s         Normal   Pulled              pod/otel-collector-8584bc4d4c-mxg7q                  Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 1.965s (3.214s including waiting). Image size: 65128183 bytes.
90s         Normal   Created             pod/otel-collector-8584bc4d4c-mxg7q                  Container created
89s         Normal   Started             pod/otel-collector-8584bc4d4c-mxg7q                  Container started
39s         Normal   SuccessfulCreate    replicaset/deploy-petstore-api-74768bbfdf            Created pod: deploy-petstore-api-74768bbfdf-b94hx
39s         Normal   SuccessfulCreate    replicaset/deploy-petstore-orchestrator-59d957fb64   Created pod: deploy-petstore-orchestrator-59d957fb64-m9ndz
39s         Normal   Scheduled           pod/deploy-petstore-orchestrator-59d957fb64-m9ndz    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-59d957fb64-m9ndz to turbo-engine-e2e-control-plane
39s         Normal   ScalingReplicaSet   deployment/deploy-petstore-api                       Scaled up replica set deploy-petstore-api-74768bbfdf from 0 to 1
39s         Normal   ScalingReplicaSet   deployment/deploy-petstore-orchestrator              Scaled up replica set deploy-petstore-orchestrator-59d957fb64 from 0 to 1
39s         Normal   Scheduled           pod/deploy-petstore-api-74768bbfdf-b94hx             Successfully assigned turbo-engine-e2e/deploy-petstore-api-74768bbfdf-b94hx to turbo-engine-e2e-control-plane
38s         Normal   Started             pod/deploy-petstore-orchestrator-59d957fb64-m9ndz    Container started
38s         Normal   Created             pod/deploy-petstore-orchestrator-59d957fb64-m9ndz    Container created
38s         Normal   Pulled              pod/deploy-petstore-orchestrator-59d957fb64-m9ndz    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
38s         Normal   Started             pod/deploy-petstore-api-74768bbfdf-b94hx             Container started
38s         Normal   Created             pod/deploy-petstore-api-74768bbfdf-b94hx             Container created
38s         Normal   Pulled              pod/deploy-petstore-api-74768bbfdf-b94hx             Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T20:10:38.748679191Z",
      "msg": "reconcile request received",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.748708886Z",
      "msg": "starting reconciliation",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.74873765Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.748758238Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.74876451Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.74876985Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.74877527Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.748780239Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.748785469Z",
      "msg": "reconciliation action",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.74879171Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.759313498Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.769159901Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.779527687Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.78763704Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.815770523Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.825425259Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.826472651Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:10:38.8265794Z",
      "msg": "reconciliation complete",
      "environment_id": "e8b7a268e9827524482ec45ad7d0665b",
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
{"time":"2026-02-21T20:09:44.712494012Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T20:10:38.732399382Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T20:10:38.735505931Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T20:10:59.579831178Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T20:11:07.981898512Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T20:11:12.194393959Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (3 lines)</summary>

```
{"time":"2026-02-21T20:09:44.403599895Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T20:10:38.742028111Z","level":"INFO","msg":"build created","build_id":"bld-1771704638742-1","environment_id":"e8b7a268e9827524482ec45ad7d0665b"}
{"time":"2026-02-21T20:10:38.742271113Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771704638742-1"}
```

</details>

<details><summary>envmanager logs (2 lines)</summary>

```
{"time":"2026-02-21T20:09:44.496651334Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T20:10:38.738595827Z","level":"INFO","msg":"environment created","id":"e8b7a268e9827524482ec45ad7d0665b","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (46 lines)</summary>

```
{"time":"2026-02-21T20:09:44.762402429Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T20:09:44.762557458Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T20:09:44.76259645Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T20:09:44.763546805Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T20:09:44.76355259Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T20:09:49.764835173Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.145.13:8082: connect: connection refused"}
{"time":"2026-02-21T20:09:54.764572841Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.145.13:8082: connect: connection refused"}
{"time":"2026-02-21T20:09:59.76516674Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:04.76962106Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:07.757706556Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T20:10:09.764806081Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:14.765341119Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:19.76777082Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:22.659601116Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T20:10:24.766311994Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:29.765087201Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:34.7691776Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:37.658941969Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T20:10:38.748679191Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","build_id":"bld-1771704638742-1"}
{"time":"2026-02-21T20:10:38.748708886Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","build_id":"bld-1771704638742-1","components":2}
{"time":"2026-02-21T20:10:38.74873765Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T20:10:38.748758238Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T20:10:38.74876451Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T20:10:38.74876985Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T20:10:38.74877527Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T20:10:38.748780239Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T20:10:38.748785469Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T20:10:38.74879171Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T20:10:38.759313498Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T20:10:38.769159901Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T20:10:38.779527687Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T20:10:38.78763704Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T20:10:38.815770523Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T20:10:38.825425259Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T20:10:38.826472651Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T20:10:38.8265794Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"e8b7a268e9827524482ec45ad7d0665b","phase":"Running","actions":7}
{"time":"2026-02-21T20:10:39.765478251Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:44.765198629Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:49.765163828Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:52.657319455Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T20:10:54.765456291Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:10:59.765678084Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:11:04.769208755Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:11:07.667272465Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T20:11:09.764906348Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:11:14.765333245Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (11 lines)</summary>

```
[2m2026-02-21T20:09:44.558156Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T20:09:44.859761Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T20:09:46.060996Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T20:09:48.259401Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T20:09:52.458717Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T20:09:52.663081Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T20:10:07.758926Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T20:10:22.660345Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T20:10:37.659710Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T20:10:52.658158Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T20:11:07.668103Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

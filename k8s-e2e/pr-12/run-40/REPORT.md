# K8s E2E Report

**Generated:** 2026-02-21T20:42:11Z

**ALL 16 TESTS PASSED**

```
00:00  Waiting for control plane deployments to roll out
00:00  Control plane ready
00:00  Setting up port-forwards
00:08  Port-forwards healthy
00:08  Running scenario: petstore-basic
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
pod/builder-678474bf88-6xfks                       1/1     Running   0          80s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-r8wc8                        1/1     Running   0          80s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-7f5d84b989-4zzjv           1/1     Running   0          27s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-b68fb58d4-snwvj   1/1     Running   0          27s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-rx4ht                    1/1     Running   0          80s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-gbzr9                       1/1     Running   0          80s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-f76v4                       1/1     Running   0          80s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-jt6wt                         1/1     Running   0          80s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-ch2jf                1/1     Running   0          80s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-zvrdm                      1/1     Running   0          79s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-9z478         1/1     Running   0          79s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.66.178    <none>        8082/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.209.124   <none>        3000/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.252.198   <none>        8083/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.133.128   <none>        3001/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.113.59    <none>        8080/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.114.245   <none>        16686/TCP,4317/TCP   80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.231.94    <none>        4317/TCP,4318/TCP    80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.3.26      <none>        8081/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.97.13     <none>        8080/TCP             27s   app.kubernetes.io/instance=aeeea48ca75a8fffc9969fc7d14a7a94,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.28.139    <none>        8080/TCP             27s   app.kubernetes.io/instance=aeeea48ca75a8fffc9969fc7d14a7a94,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.214.45    <none>        8084/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           80s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           80s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           27s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=aeeea48ca75a8fffc9969fc7d14a7a94,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           27s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=aeeea48ca75a8fffc9969fc7d14a7a94,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           80s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           80s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           80s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           80s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           80s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           80s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           80s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                     DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                       1         1         1       80s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                        1         1         1       80s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-7f5d84b989           1         1         1       27s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=aeeea48ca75a8fffc9969fc7d14a7a94,app.kubernetes.io/name=petstore-api,pod-template-hash=7f5d84b989
replicaset.apps/deploy-petstore-orchestrator-b68fb58d4   1         1         1       27s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=aeeea48ca75a8fffc9969fc7d14a7a94,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=b68fb58d4
replicaset.apps/envmanager-76c64c8cc9                    1         1         1       80s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                       1         1         1       80s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                       1         1         1       80s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                         1         1         1       80s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                1         1         1       80s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                      1         1         1       79s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4         1         1         1       79s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 4  **builder:** 28  **envmanager:** 16  **gateway:** 4  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (69 lines)</summary>

```
LAST SEEN   TYPE     REASON              OBJECT                                              MESSAGE
81s         Normal   Scheduled           pod/envmanager-76c64c8cc9-rx4ht                     Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-rx4ht to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/otel-collector                           Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
81s         Normal   Scheduled           pod/builder-678474bf88-6xfks                        Successfully assigned turbo-engine-e2e/builder-678474bf88-6xfks to turbo-engine-e2e-control-plane
81s         Normal   Scheduled           pod/otel-collector-8584bc4d4c-ch2jf                 Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-ch2jf to turbo-engine-e2e-control-plane
81s         Normal   SuccessfulCreate    replicaset/builder-678474bf88                       Created pod: builder-678474bf88-6xfks
81s         Normal   ScalingReplicaSet   deployment/builder                                  Scaled up replica set builder-678474bf88 from 0 to 1
81s         Normal   Scheduled           pod/console-78fbd5c84-r8wc8                         Successfully assigned turbo-engine-e2e/console-78fbd5c84-r8wc8 to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/jaeger                                   Scaled up replica set jaeger-54885dfdf from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/jaeger-54885dfdf                         Created pod: jaeger-54885dfdf-jt6wt
81s         Normal   Scheduled           pod/jaeger-54885dfdf-jt6wt                          Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-jt6wt to turbo-engine-e2e-control-plane
81s         Normal   SuccessfulCreate    replicaset/console-78fbd5c84                        Created pod: console-78fbd5c84-r8wc8
81s         Normal   ScalingReplicaSet   deployment/console                                  Scaled up replica set console-78fbd5c84 from 0 to 1
81s         Normal   ScalingReplicaSet   deployment/gateway                                  Scaled up replica set gateway-586c64fdf5 from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/gateway-586c64fdf5                       Created pod: gateway-586c64fdf5-f76v4
81s         Normal   Scheduled           pod/gateway-586c64fdf5-f76v4                        Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-f76v4 to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/explorer                                 Scaled up replica set explorer-5465b84fd from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/explorer-5465b84fd                       Created pod: explorer-5465b84fd-gbzr9
81s         Normal   Scheduled           pod/explorer-5465b84fd-gbzr9                        Successfully assigned turbo-engine-e2e/explorer-5465b84fd-gbzr9 to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/envmanager                               Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/envmanager-76c64c8cc9                    Created pod: envmanager-76c64c8cc9-rx4ht
81s         Normal   SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                Created pod: otel-collector-8584bc4d4c-ch2jf
80s         Normal   Created             pod/envmanager-76c64c8cc9-rx4ht                     Container created
80s         Normal   Started             pod/turbo-engine-operator-7cd95f4bc4-9z478          Container started
80s         Normal   Scheduled           pod/registry-7d5f66bcd8-zvrdm                       Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-zvrdm to turbo-engine-e2e-control-plane
80s         Normal   Created             pod/registry-7d5f66bcd8-zvrdm                       Container created
80s         Normal   Pulled              pod/envmanager-76c64c8cc9-rx4ht                     Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
80s         Normal   Started             pod/registry-7d5f66bcd8-zvrdm                       Container started
80s         Normal   Started             pod/envmanager-76c64c8cc9-rx4ht                     Container started
80s         Normal   SuccessfulCreate    replicaset/registry-7d5f66bcd8                      Created pod: registry-7d5f66bcd8-zvrdm
80s         Normal   ScalingReplicaSet   deployment/registry                                 Scaled up replica set registry-7d5f66bcd8 from 0 to 1
80s         Normal   Scheduled           pod/turbo-engine-operator-7cd95f4bc4-9z478          Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-9z478 to turbo-engine-e2e-control-plane
80s         Normal   Pulled              pod/explorer-5465b84fd-gbzr9                        Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/explorer-5465b84fd-gbzr9                        Container created
80s         Normal   Started             pod/explorer-5465b84fd-gbzr9                        Container started
80s         Normal   Pulled              pod/turbo-engine-operator-7cd95f4bc4-9z478          Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/turbo-engine-operator-7cd95f4bc4-9z478          Container created
80s         Normal   Pulled              pod/registry-7d5f66bcd8-zvrdm                       Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
80s         Normal   Pulled              pod/gateway-586c64fdf5-f76v4                        Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/gateway-586c64fdf5-f76v4                        Container created
80s         Normal   Started             pod/gateway-586c64fdf5-f76v4                        Container started
80s         Normal   SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4         Created pod: turbo-engine-operator-7cd95f4bc4-9z478
80s         Normal   ScalingReplicaSet   deployment/turbo-engine-operator                    Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
80s         Normal   Started             pod/console-78fbd5c84-r8wc8                         Container started
80s         Normal   Pulling             pod/jaeger-54885dfdf-jt6wt                          Pulling image "jaegertracing/all-in-one:1.54"
80s         Normal   Pulled              pod/builder-678474bf88-6xfks                        Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/builder-678474bf88-6xfks                        Container created
80s         Normal   Pulling             pod/otel-collector-8584bc4d4c-ch2jf                 Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
80s         Normal   Created             pod/console-78fbd5c84-r8wc8                         Container created
80s         Normal   Pulled              pod/console-78fbd5c84-r8wc8                         Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
80s         Normal   Started             pod/builder-678474bf88-6xfks                        Container started
78s         Normal   Started             pod/jaeger-54885dfdf-jt6wt                          Container started
78s         Normal   Created             pod/jaeger-54885dfdf-jt6wt                          Container created
78s         Normal   Pulled              pod/jaeger-54885dfdf-jt6wt                          Successfully pulled image "jaegertracing/all-in-one:1.54" in 1.649s (1.649s including waiting). Image size: 33344095 bytes.
76s         Normal   Pulled              pod/otel-collector-8584bc4d4c-ch2jf                 Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 2.051s (3.558s including waiting). Image size: 65128183 bytes.
76s         Normal   Started             pod/otel-collector-8584bc4d4c-ch2jf                 Container started
76s         Normal   Created             pod/otel-collector-8584bc4d4c-ch2jf                 Container created
28s         Normal   ScalingReplicaSet   deployment/deploy-petstore-orchestrator             Scaled up replica set deploy-petstore-orchestrator-b68fb58d4 from 0 to 1
28s         Normal   SuccessfulCreate    replicaset/deploy-petstore-orchestrator-b68fb58d4   Created pod: deploy-petstore-orchestrator-b68fb58d4-snwvj
28s         Normal   Started             pod/deploy-petstore-orchestrator-b68fb58d4-snwvj    Container started
28s         Normal   Created             pod/deploy-petstore-orchestrator-b68fb58d4-snwvj    Container created
28s         Normal   Pulled              pod/deploy-petstore-orchestrator-b68fb58d4-snwvj    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
28s         Normal   Scheduled           pod/deploy-petstore-orchestrator-b68fb58d4-snwvj    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-b68fb58d4-snwvj to turbo-engine-e2e-control-plane
28s         Normal   ScalingReplicaSet   deployment/deploy-petstore-api                      Scaled up replica set deploy-petstore-api-7f5d84b989 from 0 to 1
28s         Normal   SuccessfulCreate    replicaset/deploy-petstore-api-7f5d84b989           Created pod: deploy-petstore-api-7f5d84b989-4zzjv
28s         Normal   Started             pod/deploy-petstore-api-7f5d84b989-4zzjv            Container started
28s         Normal   Created             pod/deploy-petstore-api-7f5d84b989-4zzjv            Container created
28s         Normal   Pulled              pod/deploy-petstore-api-7f5d84b989-4zzjv            Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
28s         Normal   Scheduled           pod/deploy-petstore-api-7f5d84b989-4zzjv            Successfully assigned turbo-engine-e2e/deploy-petstore-api-7f5d84b989-4zzjv to turbo-engine-e2e-control-plane
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T20:41:40.161768619Z",
      "msg": "reconcile request received",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161799113Z",
      "msg": "starting reconciliation",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161819171Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161836157Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161842044Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161846799Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161851629Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.161855542Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.16186084Z",
      "msg": "reconciliation action",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.1618661Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.171721709Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.1763466Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.183165077Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.190327208Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.199622483Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.206247048Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.206319237Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T20:41:40.206362308Z",
      "msg": "reconciliation complete",
      "environment_id": "aeeea48ca75a8fffc9969fc7d14a7a94",
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
{"time":"2026-02-21T20:40:48.788653365Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T20:41:40.14948651Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T20:41:40.152068076Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T20:41:51.637138646Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T20:41:59.843338381Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T20:42:03.944253843Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (3 lines)</summary>

```
{"time":"2026-02-21T20:40:48.534102781Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T20:41:40.156863748Z","level":"INFO","msg":"build created","build_id":"bld-1771706500156-1","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94"}
{"time":"2026-02-21T20:41:40.157115515Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771706500156-1"}
```

</details>

<details><summary>envmanager logs (2 lines)</summary>

```
{"time":"2026-02-21T20:40:48.565131653Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T20:41:40.154539936Z","level":"INFO","msg":"environment created","id":"aeeea48ca75a8fffc9969fc7d14a7a94","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (42 lines)</summary>

```
{"time":"2026-02-21T20:40:49.045591396Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T20:40:49.045793337Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T20:40:49.045802529Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T20:40:49.046199188Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T20:40:49.046202773Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T20:40:54.047265297Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.66.178:8082: connect: connection refused"}
{"time":"2026-02-21T20:40:59.047936288Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.66.178:8082: connect: connection refused"}
{"time":"2026-02-21T20:41:04.047355564Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:09.051575222Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:11.856491192Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T20:41:14.048118576Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:19.047590146Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:24.047411222Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:26.846570709Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T20:41:29.048736751Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:34.047251537Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:39.047484162Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:40.161768619Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","build_id":"bld-1771706500156-1"}
{"time":"2026-02-21T20:41:40.161799113Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","build_id":"bld-1771706500156-1","components":2}
{"time":"2026-02-21T20:41:40.161819171Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T20:41:40.161836157Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T20:41:40.161842044Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T20:41:40.161846799Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T20:41:40.161851629Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T20:41:40.161855542Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T20:41:40.16186084Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T20:41:40.1618661Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T20:41:40.171721709Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T20:41:40.1763466Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T20:41:40.183165077Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T20:41:40.190327208Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T20:41:40.199622483Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T20:41:40.206247048Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T20:41:40.206319237Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T20:41:40.206362308Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"aeeea48ca75a8fffc9969fc7d14a7a94","phase":"Running","actions":7}
{"time":"2026-02-21T20:41:41.845662599Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T20:41:44.047657173Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:49.047401589Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:54.04737928Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:41:56.847817396Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T20:41:59.047413681Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T20:42:04.048126668Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (10 lines)</summary>

```
[2m2026-02-21T20:40:48.584324Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T20:40:48.958423Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T20:40:50.246881Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T20:40:52.450824Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T20:40:56.644416Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T20:40:56.849871Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T20:41:11.857166Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T20:41:26.847250Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T20:41:41.846356Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T20:41:56.848519Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

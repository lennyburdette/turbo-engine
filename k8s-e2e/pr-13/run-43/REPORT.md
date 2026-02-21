# K8s E2E Report

**Generated:** 2026-02-21T23:16:52Z

**1 FAILED** (15/16 passed)

```
00:00  Waiting for control plane deployments to roll out
00:00  Control plane ready
00:00  Setting up port-forwards
00:07  Port-forwards healthy
00:07  Running scenario: petstore-basic
00:35  Scenario petstore-basic: 13/14 passed
00:35  Tests complete: 15 passed, 1 failed
```

## Scenarios

### [petstore-basic: 1 FAILED (13/14 passed)](./scenarios/petstore-basic/report.md)

4 screenshots | [traces](./traces.html)

## Platform Health

**Pods:** 11/11 running

<details><summary>Full resource list</summary>

```
NAME                                                READY   STATUS    RESTARTS   AGE   IP            NODE                             NOMINATED NODE   READINESS GATES
pod/builder-678474bf88-tvnsw                        1/1     Running   0          77s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-kgwdv                         1/1     Running   0          77s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-8ff484989-f8q7t             1/1     Running   0          28s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-5ff5cfcbc6-kckcl   1/1     Running   0          28s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-h2cv8                     1/1     Running   0          77s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-nwdr7                        1/1     Running   0          77s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-hj629                        1/1     Running   0          77s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-gdg6j                          1/1     Running   0          77s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-87sw7                 1/1     Running   0          76s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-chnhf                       1/1     Running   0          76s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-2xknw          1/1     Running   0          76s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.162.203   <none>        8082/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.159.255   <none>        3000/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.96.122    <none>        8083/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.141.17    <none>        3001/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.27.235    <none>        8080/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.220.94    <none>        16686/TCP,4317/TCP   77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.131.114   <none>        4317/TCP,4318/TCP    77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.211.185   <none>        8081/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.204.0     <none>        8080/TCP             28s   app.kubernetes.io/instance=45de9454cf5902396338962571813693,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.94.196    <none>        8080/TCP             28s   app.kubernetes.io/instance=45de9454cf5902396338962571813693,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.4.253     <none>        8084/TCP             77s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           77s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           77s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           28s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=45de9454cf5902396338962571813693,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           28s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=45de9454cf5902396338962571813693,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           77s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           77s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           77s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           77s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           77s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           77s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           76s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                      DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                        1         1         1       77s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                         1         1         1       77s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-8ff484989             1         1         1       28s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=45de9454cf5902396338962571813693,app.kubernetes.io/name=petstore-api,pod-template-hash=8ff484989
replicaset.apps/deploy-petstore-orchestrator-5ff5cfcbc6   1         1         1       28s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=45de9454cf5902396338962571813693,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=5ff5cfcbc6
replicaset.apps/envmanager-76c64c8cc9                     1         1         1       77s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                        1         1         1       77s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                        1         1         1       77s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                          1         1         1       77s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                 1         1         1       77s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                       1         1         1       76s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4          1         1         1       76s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 5  **builder:** 27  **envmanager:** 16  **gateway:** 4  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (69 lines)</summary>

```
LAST SEEN   TYPE     REASON              OBJECT                                               MESSAGE
78s         Normal   Scheduled           pod/envmanager-76c64c8cc9-h2cv8                      Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-h2cv8 to turbo-engine-e2e-control-plane
78s         Normal   Scheduled           pod/builder-678474bf88-tvnsw                         Successfully assigned turbo-engine-e2e/builder-678474bf88-tvnsw to turbo-engine-e2e-control-plane
78s         Normal   ScalingReplicaSet   deployment/jaeger                                    Scaled up replica set jaeger-54885dfdf from 0 to 1
78s         Normal   SuccessfulCreate    replicaset/jaeger-54885dfdf                          Created pod: jaeger-54885dfdf-gdg6j
78s         Normal   SuccessfulCreate    replicaset/builder-678474bf88                        Created pod: builder-678474bf88-tvnsw
78s         Normal   ScalingReplicaSet   deployment/builder                                   Scaled up replica set builder-678474bf88 from 0 to 1
78s         Normal   Scheduled           pod/console-78fbd5c84-kgwdv                          Successfully assigned turbo-engine-e2e/console-78fbd5c84-kgwdv to turbo-engine-e2e-control-plane
78s         Normal   Scheduled           pod/jaeger-54885dfdf-gdg6j                           Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-gdg6j to turbo-engine-e2e-control-plane
78s         Normal   ScalingReplicaSet   deployment/gateway                                   Scaled up replica set gateway-586c64fdf5 from 0 to 1
78s         Normal   SuccessfulCreate    replicaset/gateway-586c64fdf5                        Created pod: gateway-586c64fdf5-hj629
78s         Normal   SuccessfulCreate    replicaset/console-78fbd5c84                         Created pod: console-78fbd5c84-kgwdv
78s         Normal   ScalingReplicaSet   deployment/console                                   Scaled up replica set console-78fbd5c84 from 0 to 1
78s         Normal   Scheduled           pod/gateway-586c64fdf5-hj629                         Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-hj629 to turbo-engine-e2e-control-plane
78s         Normal   ScalingReplicaSet   deployment/explorer                                  Scaled up replica set explorer-5465b84fd from 0 to 1
78s         Normal   SuccessfulCreate    replicaset/explorer-5465b84fd                        Created pod: explorer-5465b84fd-nwdr7
78s         Normal   Scheduled           pod/explorer-5465b84fd-nwdr7                         Successfully assigned turbo-engine-e2e/explorer-5465b84fd-nwdr7 to turbo-engine-e2e-control-plane
78s         Normal   ScalingReplicaSet   deployment/envmanager                                Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
78s         Normal   SuccessfulCreate    replicaset/envmanager-76c64c8cc9                     Created pod: envmanager-76c64c8cc9-h2cv8
77s         Normal   Created             pod/envmanager-76c64c8cc9-h2cv8                      Container created
77s         Normal   SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4          Created pod: turbo-engine-operator-7cd95f4bc4-2xknw
77s         Normal   ScalingReplicaSet   deployment/otel-collector                            Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
77s         Normal   Created             pod/registry-7d5f66bcd8-chnhf                        Container created
77s         Normal   Pulled              pod/registry-7d5f66bcd8-chnhf                        Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
77s         Normal   Scheduled           pod/registry-7d5f66bcd8-chnhf                        Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-chnhf to turbo-engine-e2e-control-plane
77s         Normal   ScalingReplicaSet   deployment/registry                                  Scaled up replica set registry-7d5f66bcd8 from 0 to 1
77s         Normal   Pulled              pod/envmanager-76c64c8cc9-h2cv8                      Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
77s         Normal   SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                 Created pod: otel-collector-8584bc4d4c-87sw7
77s         Normal   Started             pod/envmanager-76c64c8cc9-h2cv8                      Container started
77s         Normal   Scheduled           pod/turbo-engine-operator-7cd95f4bc4-2xknw           Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-2xknw to turbo-engine-e2e-control-plane
77s         Normal   Pulled              pod/turbo-engine-operator-7cd95f4bc4-2xknw           Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
77s         Normal   Created             pod/turbo-engine-operator-7cd95f4bc4-2xknw           Container created
77s         Normal   Pulled              pod/explorer-5465b84fd-nwdr7                         Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
77s         Normal   Created             pod/explorer-5465b84fd-nwdr7                         Container created
77s         Normal   Pulled              pod/builder-678474bf88-tvnsw                         Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
77s         Normal   Pulling             pod/otel-collector-8584bc4d4c-87sw7                  Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
77s         Normal   SuccessfulCreate    replicaset/registry-7d5f66bcd8                       Created pod: registry-7d5f66bcd8-chnhf
77s         Normal   ScalingReplicaSet   deployment/turbo-engine-operator                     Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
77s         Normal   Pulled              pod/gateway-586c64fdf5-hj629                         Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
77s         Normal   Created             pod/gateway-586c64fdf5-hj629                         Container created
77s         Normal   Started             pod/gateway-586c64fdf5-hj629                         Container started
77s         Normal   Scheduled           pod/otel-collector-8584bc4d4c-87sw7                  Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-87sw7 to turbo-engine-e2e-control-plane
77s         Normal   Created             pod/console-78fbd5c84-kgwdv                          Container created
77s         Normal   Pulled              pod/console-78fbd5c84-kgwdv                          Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
77s         Normal   Pulling             pod/jaeger-54885dfdf-gdg6j                           Pulling image "jaegertracing/all-in-one:1.54"
77s         Normal   Created             pod/builder-678474bf88-tvnsw                         Container created
77s         Normal   Started             pod/builder-678474bf88-tvnsw                         Container started
76s         Normal   Started             pod/console-78fbd5c84-kgwdv                          Container started
76s         Normal   Started             pod/turbo-engine-operator-7cd95f4bc4-2xknw           Container started
76s         Normal   Started             pod/explorer-5465b84fd-nwdr7                         Container started
76s         Normal   Started             pod/registry-7d5f66bcd8-chnhf                        Container started
75s         Normal   Created             pod/jaeger-54885dfdf-gdg6j                           Container created
75s         Normal   Pulled              pod/jaeger-54885dfdf-gdg6j                           Successfully pulled image "jaegertracing/all-in-one:1.54" in 2.033s (2.033s including waiting). Image size: 33344095 bytes.
74s         Normal   Started             pod/jaeger-54885dfdf-gdg6j                           Container started
72s         Normal   Pulled              pod/otel-collector-8584bc4d4c-87sw7                  Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 2.608s (4.627s including waiting). Image size: 65128183 bytes.
72s         Normal   Started             pod/otel-collector-8584bc4d4c-87sw7                  Container started
72s         Normal   Created             pod/otel-collector-8584bc4d4c-87sw7                  Container created
29s         Normal   SuccessfulCreate    replicaset/deploy-petstore-api-8ff484989             Created pod: deploy-petstore-api-8ff484989-f8q7t
29s         Normal   SuccessfulCreate    replicaset/deploy-petstore-orchestrator-5ff5cfcbc6   Created pod: deploy-petstore-orchestrator-5ff5cfcbc6-kckcl
29s         Normal   Scheduled           pod/deploy-petstore-orchestrator-5ff5cfcbc6-kckcl    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-5ff5cfcbc6-kckcl to turbo-engine-e2e-control-plane
29s         Normal   ScalingReplicaSet   deployment/deploy-petstore-api                       Scaled up replica set deploy-petstore-api-8ff484989 from 0 to 1
29s         Normal   ScalingReplicaSet   deployment/deploy-petstore-orchestrator              Scaled up replica set deploy-petstore-orchestrator-5ff5cfcbc6 from 0 to 1
29s         Normal   Scheduled           pod/deploy-petstore-api-8ff484989-f8q7t              Successfully assigned turbo-engine-e2e/deploy-petstore-api-8ff484989-f8q7t to turbo-engine-e2e-control-plane
28s         Normal   Started             pod/deploy-petstore-orchestrator-5ff5cfcbc6-kckcl    Container started
28s         Normal   Created             pod/deploy-petstore-orchestrator-5ff5cfcbc6-kckcl    Container created
28s         Normal   Pulled              pod/deploy-petstore-orchestrator-5ff5cfcbc6-kckcl    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
28s         Normal   Started             pod/deploy-petstore-api-8ff484989-f8q7t              Container started
28s         Normal   Created             pod/deploy-petstore-api-8ff484989-f8q7t              Container created
28s         Normal   Pulled              pod/deploy-petstore-api-8ff484989-f8q7t              Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T23:16:20.934621129Z",
      "msg": "reconcile request received",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934650834Z",
      "msg": "starting reconciliation",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934672084Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.93468639Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934692943Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934699224Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934704935Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934711056Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.934716226Z",
      "msg": "reconciliation action",
      "environment_id": "45de9454cf5902396338962571813693",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.93472372Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.944516364Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.953199767Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.964087079Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.972987173Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.982450941Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.987529241Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.987616464Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T23:16:20.987807059Z",
      "msg": "reconciliation complete",
      "environment_id": "45de9454cf5902396338962571813693",
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
{"time":"2026-02-21T23:15:33.218340033Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T23:16:20.918123485Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T23:16:20.921319954Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T23:16:31.710179027Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T23:16:40.067026746Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T23:16:44.234002233Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (3 lines)</summary>

```
{"time":"2026-02-21T23:15:32.81284975Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T23:16:20.928142032Z","level":"INFO","msg":"build created","build_id":"bld-1771715780928-1","environment_id":"45de9454cf5902396338962571813693"}
{"time":"2026-02-21T23:16:20.928365427Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771715780928-1"}
```

</details>

<details><summary>envmanager logs (2 lines)</summary>

```
{"time":"2026-02-21T23:15:32.858683104Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T23:16:20.924825284Z","level":"INFO","msg":"environment created","id":"45de9454cf5902396338962571813693","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (42 lines)</summary>

```
{"time":"2026-02-21T23:15:33.299307549Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T23:15:33.299467717Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T23:15:33.29947471Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T23:15:33.299938867Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T23:15:33.300242863Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T23:15:38.301585143Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.162.203:8082: connect: connection refused"}
{"time":"2026-02-21T23:15:43.304800867Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.162.203:8082: connect: connection refused"}
{"time":"2026-02-21T23:15:48.30211019Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:15:53.306119556Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:15:56.211843872Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T23:15:58.303151649Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:03.301914097Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:08.303199698Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:11.203066203Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T23:16:13.301577258Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:18.301702771Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:20.934621129Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"45de9454cf5902396338962571813693","build_id":"bld-1771715780928-1"}
{"time":"2026-02-21T23:16:20.934650834Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","build_id":"bld-1771715780928-1","components":2}
{"time":"2026-02-21T23:16:20.934672084Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T23:16:20.93468639Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T23:16:20.934692943Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T23:16:20.934699224Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T23:16:20.934704935Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T23:16:20.934711056Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T23:16:20.934716226Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T23:16:20.93472372Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T23:16:20.944516364Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T23:16:20.953199767Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T23:16:20.964087079Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T23:16:20.972987173Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T23:16:20.982450941Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T23:16:20.987529241Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T23:16:20.987616464Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T23:16:20.987807059Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"45de9454cf5902396338962571813693","phase":"Running","actions":7}
{"time":"2026-02-21T23:16:23.301864928Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:26.217931813Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T23:16:28.302808807Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:33.301619205Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:38.303296562Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:41.20196811Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T23:16:43.301537867Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T23:16:48.301527632Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (10 lines)</summary>

```
[2m2026-02-21T23:15:33.001664Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T23:15:33.307185Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T23:15:34.508026Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T23:15:36.798895Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T23:15:41.000752Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T23:15:41.205717Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T23:15:56.212710Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T23:16:11.203983Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T23:16:26.218844Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T23:16:41.202719Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

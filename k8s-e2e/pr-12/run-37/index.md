---
layout: default
title: "k8s-e2e — PR #12, Run #37"
---

# k8s-e2e — PR #12, Run #37

[View workflow run](https://github.com/lennyburdette/turbo-engine/actions/runs/22263131061)

## Report

# K8s E2E Report

**Generated:** 2026-02-21T19:50:37Z

**ALL 16 TESTS PASSED**

```
00:00  Waiting for control plane deployments to roll out
00:01  Control plane ready
00:01  Setting up port-forwards
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
NAME                                                READY   STATUS    RESTARTS   AGE   IP            NODE                             NOMINATED NODE   READINESS GATES
pod/builder-678474bf88-c7mfq                        1/1     Running   0          80s   10.244.0.5    turbo-engine-e2e-control-plane   <none>           <none>
pod/console-78fbd5c84-h5zbq                         1/1     Running   0          80s   10.244.0.6    turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-api-55cdd8fd69-7hdd8            1/1     Running   0          27s   10.244.0.14   turbo-engine-e2e-control-plane   <none>           <none>
pod/deploy-petstore-orchestrator-5dc74bfcb8-42c6k   1/1     Running   0          27s   10.244.0.15   turbo-engine-e2e-control-plane   <none>           <none>
pod/envmanager-76c64c8cc9-shzfn                     1/1     Running   0          80s   10.244.0.7    turbo-engine-e2e-control-plane   <none>           <none>
pod/explorer-5465b84fd-tc54c                        1/1     Running   0          80s   10.244.0.8    turbo-engine-e2e-control-plane   <none>           <none>
pod/gateway-586c64fdf5-xgm9n                        1/1     Running   0          80s   10.244.0.9    turbo-engine-e2e-control-plane   <none>           <none>
pod/jaeger-54885dfdf-nt44m                          1/1     Running   0          80s   10.244.0.10   turbo-engine-e2e-control-plane   <none>           <none>
pod/otel-collector-8584bc4d4c-p72k2                 1/1     Running   0          80s   10.244.0.11   turbo-engine-e2e-control-plane   <none>           <none>
pod/registry-7d5f66bcd8-jlc57                       1/1     Running   0          80s   10.244.0.12   turbo-engine-e2e-control-plane   <none>           <none>
pod/turbo-engine-operator-7cd95f4bc4-nxpx4          1/1     Running   0          80s   10.244.0.13   turbo-engine-e2e-control-plane   <none>           <none>

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE   SELECTOR
service/builder                     ClusterIP   10.96.200.161   <none>        8082/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
service/console                     ClusterIP   10.96.152.217   <none>        3000/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
service/envmanager                  ClusterIP   10.96.193.176   <none>        8083/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
service/explorer                    ClusterIP   10.96.228.108   <none>        3001/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
service/gateway                     ClusterIP   10.96.172.175   <none>        8080/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
service/jaeger                      ClusterIP   10.96.171.184   <none>        16686/TCP,4317/TCP   80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
service/otel-collector              ClusterIP   10.96.152.213   <none>        4317/TCP,4318/TCP    80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
service/registry                    ClusterIP   10.96.32.22     <none>        8081/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
service/svc-petstore-api            ClusterIP   10.96.14.165    <none>        8080/TCP             27s   app.kubernetes.io/instance=f15add989310e4676ae9724e201ed2e2,app.kubernetes.io/name=petstore-api
service/svc-petstore-orchestrator   ClusterIP   10.96.66.72     <none>        8080/TCP             27s   app.kubernetes.io/instance=f15add989310e4676ae9724e201ed2e2,app.kubernetes.io/name=petstore-orchestrator
service/turbo-engine-operator       ClusterIP   10.96.45.17     <none>        8084/TCP             80s   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS              IMAGES                                        SELECTOR
deployment.apps/builder                        1/1     1            1           80s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine
deployment.apps/console                        1/1     1            1           80s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine
deployment.apps/deploy-petstore-api            1/1     1            1           27s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=f15add989310e4676ae9724e201ed2e2,app.kubernetes.io/name=petstore-api
deployment.apps/deploy-petstore-orchestrator   1/1     1            1           27s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=f15add989310e4676ae9724e201ed2e2,app.kubernetes.io/name=petstore-orchestrator
deployment.apps/envmanager                     1/1     1            1           80s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine
deployment.apps/explorer                       1/1     1            1           80s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine
deployment.apps/gateway                        1/1     1            1           80s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine
deployment.apps/jaeger                         1/1     1            1           80s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine
deployment.apps/otel-collector                 1/1     1            1           80s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine
deployment.apps/registry                       1/1     1            1           80s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine
deployment.apps/turbo-engine-operator          1/1     1            1           80s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine

NAME                                                      DESIRED   CURRENT   READY   AGE   CONTAINERS              IMAGES                                        SELECTOR
replicaset.apps/builder-678474bf88                        1         1         1       80s   builder                 turbo-engine/builder:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=builder,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=678474bf88
replicaset.apps/console-78fbd5c84                         1         1         1       80s   console                 turbo-engine/console:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=console,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=78fbd5c84
replicaset.apps/deploy-petstore-api-55cdd8fd69            1         1         1       27s   petstore-api            turbo-engine/petstore-mock:e2e                app.kubernetes.io/instance=f15add989310e4676ae9724e201ed2e2,app.kubernetes.io/name=petstore-api,pod-template-hash=55cdd8fd69
replicaset.apps/deploy-petstore-orchestrator-5dc74bfcb8   1         1         1       27s   petstore-orchestrator   turbo-engine/orchestrator:e2e                 app.kubernetes.io/instance=f15add989310e4676ae9724e201ed2e2,app.kubernetes.io/name=petstore-orchestrator,pod-template-hash=5dc74bfcb8
replicaset.apps/envmanager-76c64c8cc9                     1         1         1       80s   envmanager              turbo-engine/envmanager:e2e                   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=envmanager,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=76c64c8cc9
replicaset.apps/explorer-5465b84fd                        1         1         1       80s   explorer                turbo-engine/explorer:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=explorer,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=5465b84fd
replicaset.apps/gateway-586c64fdf5                        1         1         1       80s   gateway                 turbo-engine/gateway:e2e                      app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=gateway,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=586c64fdf5
replicaset.apps/jaeger-54885dfdf                          1         1         1       80s   jaeger                  jaegertracing/all-in-one:1.54                 app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=jaeger,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=54885dfdf
replicaset.apps/otel-collector-8584bc4d4c                 1         1         1       80s   otel-collector          otel/opentelemetry-collector-contrib:0.96.0   app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=otel-collector,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=8584bc4d4c
replicaset.apps/registry-7d5f66bcd8                       1         1         1       80s   registry                turbo-engine/registry:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=registry,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7d5f66bcd8
replicaset.apps/turbo-engine-operator-7cd95f4bc4          1         1         1       80s   operator                turbo-engine/operator:e2e                     app.kubernetes.io/managed-by=kustomize,app.kubernetes.io/name=operator,app.kubernetes.io/part-of=turbo-engine,pod-template-hash=7cd95f4bc4
```

</details>

## Traces

**registry:** 5  **builder:** 28  **envmanager:** 16  **gateway:** 4  **orchestrator:** 5  **petstore-mock:** 6  

[Open trace viewer](./traces.html)

## Debug Data

<details><summary>K8s events (69 lines)</summary>

```
LAST SEEN   TYPE     REASON              OBJECT                                               MESSAGE
81s         Normal   Scheduled           pod/jaeger-54885dfdf-nt44m                           Successfully assigned turbo-engine-e2e/jaeger-54885dfdf-nt44m to turbo-engine-e2e-control-plane
81s         Normal   Scheduled           pod/registry-7d5f66bcd8-jlc57                        Successfully assigned turbo-engine-e2e/registry-7d5f66bcd8-jlc57 to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/otel-collector                            Scaled up replica set otel-collector-8584bc4d4c from 0 to 1
81s         Normal   Scheduled           pod/builder-678474bf88-c7mfq                         Successfully assigned turbo-engine-e2e/builder-678474bf88-c7mfq to turbo-engine-e2e-control-plane
81s         Normal   SuccessfulCreate    replicaset/envmanager-76c64c8cc9                     Created pod: envmanager-76c64c8cc9-shzfn
81s         Normal   ScalingReplicaSet   deployment/builder                                   Scaled up replica set builder-678474bf88 from 0 to 1
81s         Normal   Scheduled           pod/console-78fbd5c84-h5zbq                          Successfully assigned turbo-engine-e2e/console-78fbd5c84-h5zbq to turbo-engine-e2e-control-plane
81s         Normal   Scheduled           pod/otel-collector-8584bc4d4c-p72k2                  Successfully assigned turbo-engine-e2e/otel-collector-8584bc4d4c-p72k2 to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/jaeger                                    Scaled up replica set jaeger-54885dfdf from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/jaeger-54885dfdf                          Created pod: jaeger-54885dfdf-nt44m
81s         Normal   SuccessfulCreate    replicaset/console-78fbd5c84                         Created pod: console-78fbd5c84-h5zbq
81s         Normal   ScalingReplicaSet   deployment/console                                   Scaled up replica set console-78fbd5c84 from 0 to 1
81s         Normal   Pulled              pod/builder-678474bf88-c7mfq                         Container image "turbo-engine/builder:e2e" already present on machine and can be accessed by the pod
81s         Normal   ScalingReplicaSet   deployment/turbo-engine-operator                     Scaled up replica set turbo-engine-operator-7cd95f4bc4 from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/builder-678474bf88                        Created pod: builder-678474bf88-c7mfq
81s         Normal   ScalingReplicaSet   deployment/gateway                                   Scaled up replica set gateway-586c64fdf5 from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/gateway-586c64fdf5                        Created pod: gateway-586c64fdf5-xgm9n
81s         Normal   Scheduled           pod/turbo-engine-operator-7cd95f4bc4-nxpx4           Successfully assigned turbo-engine-e2e/turbo-engine-operator-7cd95f4bc4-nxpx4 to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/registry                                  Scaled up replica set registry-7d5f66bcd8 from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/registry-7d5f66bcd8                       Created pod: registry-7d5f66bcd8-jlc57
81s         Normal   Scheduled           pod/gateway-586c64fdf5-xgm9n                         Successfully assigned turbo-engine-e2e/gateway-586c64fdf5-xgm9n to turbo-engine-e2e-control-plane
81s         Normal   ScalingReplicaSet   deployment/explorer                                  Scaled up replica set explorer-5465b84fd from 0 to 1
81s         Normal   SuccessfulCreate    replicaset/explorer-5465b84fd                        Created pod: explorer-5465b84fd-tc54c
81s         Normal   SuccessfulCreate    replicaset/turbo-engine-operator-7cd95f4bc4          Created pod: turbo-engine-operator-7cd95f4bc4-nxpx4
81s         Normal   Scheduled           pod/envmanager-76c64c8cc9-shzfn                      Successfully assigned turbo-engine-e2e/envmanager-76c64c8cc9-shzfn to turbo-engine-e2e-control-plane
81s         Normal   Scheduled           pod/explorer-5465b84fd-tc54c                         Successfully assigned turbo-engine-e2e/explorer-5465b84fd-tc54c to turbo-engine-e2e-control-plane
81s         Normal   SuccessfulCreate    replicaset/otel-collector-8584bc4d4c                 Created pod: otel-collector-8584bc4d4c-p72k2
81s         Normal   ScalingReplicaSet   deployment/envmanager                                Scaled up replica set envmanager-76c64c8cc9 from 0 to 1
80s         Normal   Created             pod/envmanager-76c64c8cc9-shzfn                      Container created
80s         Normal   Created             pod/turbo-engine-operator-7cd95f4bc4-nxpx4           Container created
80s         Normal   Pulled              pod/envmanager-76c64c8cc9-shzfn                      Container image "turbo-engine/envmanager:e2e" already present on machine and can be accessed by the pod
80s         Normal   Pulled              pod/explorer-5465b84fd-tc54c                         Container image "turbo-engine/explorer:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/explorer-5465b84fd-tc54c                         Container created
80s         Normal   Started             pod/explorer-5465b84fd-tc54c                         Container started
80s         Normal   Pulled              pod/registry-7d5f66bcd8-jlc57                        Container image "turbo-engine/registry:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/registry-7d5f66bcd8-jlc57                        Container created
80s         Normal   Started             pod/registry-7d5f66bcd8-jlc57                        Container started
80s         Normal   Pulled              pod/gateway-586c64fdf5-xgm9n                         Container image "turbo-engine/gateway:e2e" already present on machine and can be accessed by the pod
80s         Normal   Created             pod/gateway-586c64fdf5-xgm9n                         Container created
80s         Normal   Started             pod/gateway-586c64fdf5-xgm9n                         Container started
80s         Normal   Pulled              pod/turbo-engine-operator-7cd95f4bc4-nxpx4           Container image "turbo-engine/operator:e2e" already present on machine and can be accessed by the pod
80s         Normal   Started             pod/envmanager-76c64c8cc9-shzfn                      Container started
80s         Normal   Started             pod/turbo-engine-operator-7cd95f4bc4-nxpx4           Container started
80s         Normal   Pulling             pod/jaeger-54885dfdf-nt44m                           Pulling image "jaegertracing/all-in-one:1.54"
80s         Normal   Created             pod/builder-678474bf88-c7mfq                         Container created
80s         Normal   Started             pod/builder-678474bf88-c7mfq                         Container started
80s         Normal   Pulling             pod/otel-collector-8584bc4d4c-p72k2                  Pulling image "otel/opentelemetry-collector-contrib:0.96.0"
80s         Normal   Started             pod/console-78fbd5c84-h5zbq                          Container started
80s         Normal   Created             pod/console-78fbd5c84-h5zbq                          Container created
80s         Normal   Pulled              pod/console-78fbd5c84-h5zbq                          Container image "turbo-engine/console:e2e" already present on machine and can be accessed by the pod
78s         Normal   Created             pod/jaeger-54885dfdf-nt44m                           Container created
78s         Normal   Pulled              pod/jaeger-54885dfdf-nt44m                           Successfully pulled image "jaegertracing/all-in-one:1.54" in 2.457s (2.457s including waiting). Image size: 33344095 bytes.
77s         Normal   Started             pod/jaeger-54885dfdf-nt44m                           Container started
75s         Normal   Pulled              pod/otel-collector-8584bc4d4c-p72k2                  Successfully pulled image "otel/opentelemetry-collector-contrib:0.96.0" in 2.551s (4.851s including waiting). Image size: 65128183 bytes.
75s         Normal   Started             pod/otel-collector-8584bc4d4c-p72k2                  Container started
75s         Normal   Created             pod/otel-collector-8584bc4d4c-p72k2                  Container created
28s         Normal   ScalingReplicaSet   deployment/deploy-petstore-orchestrator              Scaled up replica set deploy-petstore-orchestrator-5dc74bfcb8 from 0 to 1
28s         Normal   SuccessfulCreate    replicaset/deploy-petstore-orchestrator-5dc74bfcb8   Created pod: deploy-petstore-orchestrator-5dc74bfcb8-42c6k
28s         Normal   Started             pod/deploy-petstore-orchestrator-5dc74bfcb8-42c6k    Container started
28s         Normal   Created             pod/deploy-petstore-orchestrator-5dc74bfcb8-42c6k    Container created
28s         Normal   Pulled              pod/deploy-petstore-orchestrator-5dc74bfcb8-42c6k    Container image "turbo-engine/orchestrator:e2e" already present on machine and can be accessed by the pod
28s         Normal   Scheduled           pod/deploy-petstore-orchestrator-5dc74bfcb8-42c6k    Successfully assigned turbo-engine-e2e/deploy-petstore-orchestrator-5dc74bfcb8-42c6k to turbo-engine-e2e-control-plane
28s         Normal   ScalingReplicaSet   deployment/deploy-petstore-api                       Scaled up replica set deploy-petstore-api-55cdd8fd69 from 0 to 1
28s         Normal   SuccessfulCreate    replicaset/deploy-petstore-api-55cdd8fd69            Created pod: deploy-petstore-api-55cdd8fd69-7hdd8
28s         Normal   Started             pod/deploy-petstore-api-55cdd8fd69-7hdd8             Container started
28s         Normal   Created             pod/deploy-petstore-api-55cdd8fd69-7hdd8             Container created
28s         Normal   Pulled              pod/deploy-petstore-api-55cdd8fd69-7hdd8             Container image "turbo-engine/petstore-mock:e2e" already present on machine and can be accessed by the pod
28s         Normal   Scheduled           pod/deploy-petstore-api-55cdd8fd69-7hdd8             Successfully assigned turbo-engine-e2e/deploy-petstore-api-55cdd8fd69-7hdd8 to turbo-engine-e2e-control-plane
```

</details>

<details><summary>Operator actions (185 lines)</summary>

```
{
  "actions": [
    {
      "time": "2026-02-21T19:50:06.200669261Z",
      "msg": "reconcile request received",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "reconcile request received",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.20069502Z",
      "msg": "starting reconciliation",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "starting reconciliation",
      "resource_kind": "",
      "resource_name": "",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200718003Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200735195Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200741476Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200746496Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200751746Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200756755Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200772084Z",
      "msg": "reconciliation action",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.200779578Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-api",
      "details": "image=artifact:petstore-api-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.211625983Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-api",
      "details": "selector=petstore-api",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.219072138Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-api",
      "details": "env_vars=0",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.224437502Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Deployment",
      "resource_name": "deploy-petstore-orchestrator",
      "details": "image=artifact:petstore-orchestrator-hash replicas=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.231258304Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Service",
      "resource_name": "svc-petstore-orchestrator",
      "details": "selector=petstore-orchestrator",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.245235155Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "ConfigMap",
      "resource_name": "cm-petstore-orchestrator",
      "details": "env_vars=1",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.253256685Z",
      "msg": "applying action",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "Ingress",
      "resource_name": "localhost-ingress",
      "details": "host=localhost routes=1 tls=false",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.253708411Z",
      "msg": "ingress action handled via gateway-config endpoint",
      "environment_id": "",
      "action": "Create",
      "resource_kind": "",
      "resource_name": "localhost-ingress",
      "details": "",
      "phase": ""
    },
    {
      "time": "2026-02-21T19:50:06.25380892Z",
      "msg": "reconciliation complete",
      "environment_id": "f15add989310e4676ae9724e201ed2e2",
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
{"time":"2026-02-21T19:49:14.643162418Z","level":"INFO","msg":"starting registry service","port":"8081"}
{"time":"2026-02-21T19:50:06.184415623Z","level":"INFO","msg":"published package","id":"pkg_1","name":"petstore-api","version":"1.0.0"}
{"time":"2026-02-21T19:50:06.187552383Z","level":"INFO","msg":"published package","id":"pkg_2","name":"petstore-orchestrator","version":"1.0.0"}
{"time":"2026-02-21T19:50:16.948770934Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T19:50:25.31511987Z","level":"INFO","msg":"listed packages","count":2}
{"time":"2026-02-21T19:50:29.492548729Z","level":"INFO","msg":"listed packages","count":2}
```

</details>

<details><summary>builder logs (3 lines)</summary>

```
{"time":"2026-02-21T19:49:14.429313735Z","level":"INFO","msg":"builder service starting","port":"8082"}
{"time":"2026-02-21T19:50:06.19409925Z","level":"INFO","msg":"build created","build_id":"bld-1771703406194-1","environment_id":"f15add989310e4676ae9724e201ed2e2"}
{"time":"2026-02-21T19:50:06.194321067Z","level":"INFO","msg":"build completed successfully","build_id":"bld-1771703406194-1"}
```

</details>

<details><summary>envmanager logs (2 lines)</summary>

```
{"time":"2026-02-21T19:49:14.524189393Z","level":"INFO","msg":"starting server","addr":":8083"}
{"time":"2026-02-21T19:50:06.190799807Z","level":"INFO","msg":"environment created","id":"f15add989310e4676ae9724e201ed2e2","name":"petstore-e2e"}
```

</details>

<details><summary>turbo-engine-operator logs (42 lines)</summary>

```
{"time":"2026-02-21T19:49:14.808340203Z","level":"INFO","msg":"starting operator service","version":"0.1.0","log_level":"debug"}
{"time":"2026-02-21T19:49:14.80852509Z","level":"WARN","msg":"failed to initialize tracer, continuing without tracing","error":"creating resource: conflicting Schema URL: https://opentelemetry.io/schemas/1.26.0 and https://opentelemetry.io/schemas/1.24.0"}
{"time":"2026-02-21T19:49:14.808541961Z","level":"INFO","msg":"operator mode: k8s — will create real Kubernetes resources"}
{"time":"2026-02-21T19:49:14.809360928Z","level":"INFO","msg":"starting builder poll loop","component":"poller","builder_url":"http://builder:8082","interval":5000000000}
{"time":"2026-02-21T19:49:14.80898928Z","level":"INFO","msg":"listening","addr":":8084"}
{"time":"2026-02-21T19:49:19.810627957Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.200.161:8082: connect: connection refused"}
{"time":"2026-02-21T19:49:24.811242033Z","level":"DEBUG","msg":"failed to poll builder (will retry)","component":"poller","builder_url":"http://builder:8082","error":"Get \"http://builder:8082/v1/graphs\": dial tcp 10.96.200.161:8082: connect: connection refused"}
{"time":"2026-02-21T19:49:29.810554115Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:49:34.814669276Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:49:37.643070191Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T19:49:39.811622729Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:49:44.811620616Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:49:49.8128515Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:49:52.548930186Z","level":"INFO","msg":"gateway config request","component":"handler","routes":0}
{"time":"2026-02-21T19:49:54.810984343Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:49:59.810829132Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:50:04.815091005Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:50:06.200669261Z","level":"INFO","msg":"reconcile request received","component":"handler","environment_id":"f15add989310e4676ae9724e201ed2e2","build_id":"bld-1771703406194-1"}
{"time":"2026-02-21T19:50:06.20069502Z","level":"INFO","msg":"starting reconciliation","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","build_id":"bld-1771703406194-1","components":2}
{"time":"2026-02-21T19:50:06.200718003Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T19:50:06.200735195Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T19:50:06.200741476Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T19:50:06.200746496Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"Deployment","resource_name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T19:50:06.200751746Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"Service","resource_name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T19:50:06.200756755Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"ConfigMap","resource_name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T19:50:06.200772084Z","level":"INFO","msg":"reconciliation action","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","action":"Create","resource_kind":"Ingress","resource_name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T19:50:06.200779578Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-api","details":"image=artifact:petstore-api-hash replicas=1"}
{"time":"2026-02-21T19:50:06.211625983Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-api","details":"selector=petstore-api"}
{"time":"2026-02-21T19:50:06.219072138Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-api","details":"env_vars=0"}
{"time":"2026-02-21T19:50:06.224437502Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Deployment","name":"deploy-petstore-orchestrator","details":"image=artifact:petstore-orchestrator-hash replicas=1"}
{"time":"2026-02-21T19:50:06.231258304Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Service","name":"svc-petstore-orchestrator","details":"selector=petstore-orchestrator"}
{"time":"2026-02-21T19:50:06.245235155Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"ConfigMap","name":"cm-petstore-orchestrator","details":"env_vars=1"}
{"time":"2026-02-21T19:50:06.253256685Z","level":"INFO","msg":"applying action","component":"k8s-applier","type":"Create","kind":"Ingress","name":"localhost-ingress","details":"host=localhost routes=1 tls=false"}
{"time":"2026-02-21T19:50:06.253708411Z","level":"INFO","msg":"ingress action handled via gateway-config endpoint","component":"k8s-applier","type":"Create","name":"localhost-ingress"}
{"time":"2026-02-21T19:50:06.25380892Z","level":"INFO","msg":"reconciliation complete","component":"reconciler","environment_id":"f15add989310e4676ae9724e201ed2e2","phase":"Running","actions":7}
{"time":"2026-02-21T19:50:07.544827954Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T19:50:09.812099626Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:50:14.810731463Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:50:19.810702847Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:50:22.544872527Z","level":"INFO","msg":"gateway config request","component":"handler","routes":1}
{"time":"2026-02-21T19:50:24.812641679Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
{"time":"2026-02-21T19:50:29.810724332Z","level":"WARN","msg":"builder returned non-200 status","component":"poller","builder_url":"http://builder:8082","status":404}
```

</details>

<details><summary>gateway logs (10 lines)</summary>

```
[2m2026-02-21T19:49:14.452681Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m starting gateway [3mport[0m[2m=[0m8080 [3mconfig_url[0m[2m=[0mSome("http://turbo-engine-operator:8084/v1/gateway-config")
[2m2026-02-21T19:49:14.754819Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m1 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T19:49:15.953985Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m2 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T19:49:18.147268Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m config not available yet, retrying [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config) [3mattempt[0m[2m=[0m3 [3mmax_attempts[0m[2m=[0m4
[2m2026-02-21T19:49:22.345179Z[0m [33m WARN[0m [2mgateway[0m[2m:[0m failed to load config after retries — starting with empty routing table [3merr[0m[2m=[0mupstream unavailable: error sending request for url (http://turbo-engine-operator:8084/v1/gateway-config)
[2m2026-02-21T19:49:22.548154Z[0m [32m INFO[0m [2mgateway[0m[2m:[0m gateway listening [3maddr[0m[2m=[0m0.0.0.0:8080
[2m2026-02-21T19:49:37.644404Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T19:49:52.549643Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m0
[2m2026-02-21T19:50:07.545577Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
[2m2026-02-21T19:50:22.545547Z[0m [32m INFO[0m [2mgateway::config[0m[2m:[0m config reloaded [3mroutes[0m[2m=[0m1
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

# K8s E2E Report

**Generated:** 2026-02-21T20:04:00Z

## Scenarios

_No scenario reports found._

## Platform Health

**Pods:** 0
0/0
0 running

<details><summary>Full resource list</summary>

```
E0221 20:03:54.787780   25428 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:54.788703   25428 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:54.790551   25428 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:54.791171   25428 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:54.792797   25428 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
The connection to the server localhost:8080 was refused - did you specify the right host or port?
```

</details>

## Debug Data

<details><summary>K8s events (6 lines)</summary>

```
E0221 20:03:56.993503   25670 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:56.994167   25670 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:56.995791   25670 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:56.996276   25670 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
E0221 20:03:56.997882   25670 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"http://localhost:8080/api?timeout=32s\": dial tcp [::1]:8080: connect: connection refused"
The connection to the server localhost:8080 was refused - did you specify the right host or port?
```

</details>

<details><summary>Operator actions (4 lines)</summary>

```
{
  "actions": [],
  "count": 0
}
```

</details>

<details><summary>registry logs (1 lines)</summary>

```
(no logs available — deployment may not exist)
```

</details>

<details><summary>builder logs (1 lines)</summary>

```
(no logs available — deployment may not exist)
```

</details>

<details><summary>envmanager logs (1 lines)</summary>

```
(no logs available — deployment may not exist)
```

</details>

<details><summary>turbo-engine-operator logs (1 lines)</summary>

```
(no logs available — deployment may not exist)
```

</details>

<details><summary>gateway logs (1 lines)</summary>

```
(no logs available — deployment may not exist)
```

</details>

---

_End of report. Per-scenario details are in the linked scenario reports above._

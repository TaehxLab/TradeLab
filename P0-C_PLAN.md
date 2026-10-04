# P0-C Plan: Integration and Release Gate

1. Integrate SchedulerGuard into live refresh/recovery cycles.
2. Integrate StorageLock and storage-event reconciliation for multi-tab safety.
3. Instrument every provider with request outcome, CORS/network classification, latency and schema validation.
4. Add deterministic browser test mode with mocked success, timeout, HTTP error, stale data and failover responses.
5. Capture console and network failures in CI.
6. Add responsive screenshot diff approval.
7. Enforce GitHub Actions merge gate for unit, browser, audit and artifact checks.
8. Add staging-only deployment and rollback artifact; keep production disabled.
9. Run target-device Thai typography review.
10. Exit only when Critical=0 and High=0.

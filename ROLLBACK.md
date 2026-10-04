# Rollback Procedure

1. Stop staging publication.
2. Restore the immutable P0-B ZIP.
3. Do not migrate or delete local statistics.
4. Clear only `tradelab-runtime-lock` if an expired lock remains.
5. Preserve `profile-forward-trades-v1`, `profile-research-v1` and `forward-test-v2`.
6. Record reason, affected version and validation result in the bug register.

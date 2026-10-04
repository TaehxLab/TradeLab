# Database Foundation H1

## Enabled
- Normalized four-profile schema
- Profile and configuration versioning
- Shared market snapshots and regimes
- Separate analysis, signals, plans, trades and events
- Read-only RLS for browser roles
- Profile statistics view

## Disabled
- Parallel profile logic
- Browser writes to Supabase
- Automatic migration of legacy local statistics

These remain disabled intentionally until v1.8.2.

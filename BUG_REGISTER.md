# Bug Register

## Closed
- **BUG-H3-001 / Critical:** Profile Forward read entry and SL objects as numbers, blocking every profile trade. Fixed in H3.1 and covered by contract and functional tests.

## Open
- **P0A-001 / High:** Full browser E2E is not included in P0-A. Planned for P0-B.
- **P0A-002 / High:** API/CORS failure simulation remains pending P0-B.
- **P0A-003 / High:** Multi-tab localStorage race handling remains pending P0-B.
- **P0A-004 / Medium:** Monolithic inline application remains pending modular refactor after stabilization.

## P0-B findings
- **P0B-001 / High / Open:** Live providers returned no usable price in the isolated browser test. Fail-safe WAIT worked; provider-by-provider CORS and schema diagnosis is required before online release.
- **P0B-002 / Medium / Open:** Thai glyphs are unavailable in the Linux headless browser image. The application font stack now includes Noto Sans Thai, Leelawadee UI and Tahoma; production visual acceptance must run on target devices.
- **P0B-003 / High / Mitigated foundation:** Scheduler overlap and multi-tab writes lacked isolated guards. Testable SchedulerGuard and StorageLock foundations were added; full app integration remains for P0-C/refactor.

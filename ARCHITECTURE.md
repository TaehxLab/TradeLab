# P1 Modular Architecture

Boundaries: app orchestration, core scheduling/clock, data quality/providers, pure indicators, versioned strategies, trade geometry/lifecycle, statistics, storage keys/locks and UI view models. UI modules do not calculate strategy; data modules do not issue decisions; statistics are pure projections. The P0-E application remains available as compatibility shell while modules are validated for parity.

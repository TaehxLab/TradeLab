# Data Contracts v1.0.0

P0-A locks the runtime shapes used by candles, plans, profile decisions and profile forward trades. A contract failure blocks creation of a forward record and logs the rejection.

## Candle
Required: `t`, `o`, `h`, `l`, `c`. Time must be ISO-parseable; OHLC must be finite; high/low geometry must be valid. Trigger/outcome series require closed candles, ascending timestamps and no duplicates.

## Trade Plan
Required: `valid=true`, `direction`, `entry.price`, `sl.price`, and `targets[0].price`. BUY requires `SL < Entry < TP1`; SELL requires `TP1 < Entry < SL`.

## Profile Decision
Required: fixed profile code, semantic version and direction `BUY|SELL|WAIT`.

## Profile Forward Trade
Required identity, profile/version, valid numeric geometry, opened timestamp, status and result fields. Storage stream: `profile-forward-trades-v1`.

## Change control
Any shape or strategy semantic change requires contract or strategy version increment and a separate statistics stream when outcomes can change.

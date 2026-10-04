(function (global) {
  "use strict";

  const CONFIG = {
    projectUrl: "https://wwlczpcmcugqhoneqndq.supabase.co/rest/v1/",
    publishableKey: "sb_publishable_4aB1ecEpPexmSRp7TUqVBQ_7rDaVCOq"
  };

  const TABLE = "profile_forward_trades";
  const LOCAL_KEY = "profile-forward-trades-v1";

  function normalizeProjectUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function isConfigured() {
    const url = normalizeProjectUrl(CONFIG.projectUrl);
    const key = String(CONFIG.publishableKey || "").trim();

    return (
      url.startsWith("https://") &&
      url.endsWith(".supabase.co") &&
      key.length > 20
    );
  }

  function headers(extra = {}) {
    return {
      apikey: CONFIG.publishableKey,
      Authorization: `Bearer ${CONFIG.publishableKey}`,
      "Content-Type": "application/json",
      ...extra
    };
  }

  function report(type, data = {}) {
    try {
      global.TradeLabReliability?.diagnostics.push(type, data);
    } catch {}

    if (type.includes("ERROR")) {
      console.error(`[TradeLab Supabase] ${type}`, data);
    } else {
      console.info(`[TradeLab Supabase] ${type}`, data);
    }
  }

  function localToDatabase(x) {
    return {
      signal_key: String(x.signalKey),
      local_trade_id: String(x.id || ""),
      symbol: "XAUUSD",
      profile_code: String(x.profileCode),
      profile_version: String(x.profileVersion),
      logic: x.logic || null,
      direction: x.direction,
      entry_price: Number(x.entry),
      stop_loss: Number(x.sl),
      risk: Number(x.risk),
      take_profit_1: Number(x.tp1),
      take_profit_1_r: Number.isFinite(Number(x.tp1R)) ? Number(x.tp1R) : null,
      status: "OPEN",
      result: null,
      realized_r: null,
      resolution: null,
      market_regime: x.marketRegime || null,
      analysis_mode: x.analysisMode || null,
      opened_at: x.openedAt,
      closed_at: null
    };
  }

  function databaseToLocal(x) {
    return {
      id: x.local_trade_id || x.signal_key,
      signalKey: x.signal_key,
      profileCode: x.profile_code,
      profileVersion: x.profile_version,
      logic: x.logic,
      direction: x.direction,
      entry: Number(x.entry_price),
      sl: Number(x.stop_loss),
      risk: Number(x.risk),
      tp1: Number(x.take_profit_1),
      tp1R: x.take_profit_1_r === null ? null : Number(x.take_profit_1_r),
      status: x.status,
      result: x.result,
      realizedR: x.realized_r === null ? null : Number(x.realized_r),
      openedAt: x.opened_at,
      closedAt: x.closed_at,
      resolution: x.resolution,
      marketRegime: x.market_regime,
      analysisMode: x.analysis_mode
    };
  }

  async function request(path, options = {}) {
    if (!isConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");

    const url = `${normalizeProjectUrl(CONFIG.projectUrl)}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: headers(options.headers || {}),
      cache: "no-store"
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!response.ok) {
      const message = data?.message || data?.error_description || data?.hint ||
        `${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    return data;
  }

  async function pullRemote() {
    const columns = [
      "signal_key", "local_trade_id", "profile_code", "profile_version", "logic",
      "direction", "entry_price", "stop_loss", "risk", "take_profit_1",
      "take_profit_1_r", "status", "result", "realized_r", "resolution",
      "market_regime", "analysis_mode", "opened_at", "closed_at"
    ].join(",");

    const rows = await request(
      `/rest/v1/${TABLE}?select=${encodeURIComponent(columns)}&order=opened_at.asc&limit=10000`,
      { method: "GET" }
    );
    return Array.isArray(rows) ? rows.map(databaseToLocal) : [];
  }

  async function insertOpenTrade(trade) {
    const payload = localToDatabase(trade);
    await request(`/rest/v1/${TABLE}?on_conflict=signal_key`, {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify(payload)
    });
  }

  async function resolveTrade(trade) {
    if (trade.status === "OPEN" || !trade.closedAt) return false;

    await request("/rest/v1/rpc/resolve_profile_forward_trade", {
      method: "POST",
      body: JSON.stringify({
        p_signal_key: trade.signalKey,
        p_status: trade.status,
        p_result: trade.result ?? null,
        p_realized_r: Number.isFinite(Number(trade.realizedR)) ? Number(trade.realizedR) : null,
        p_resolution: trade.resolution || null,
        p_closed_at: trade.closedAt
      })
    });
    return true;
  }

  function getLocalTrades() {
    try {
      const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function saveLocalTrades(rows) {
    const guarded = global.TradeLabReliability?.withWriteLock(() => {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-10000)));
      return true;
    });

    if (guarded && !guarded.ok) {
      report("SUPABASE_LOCAL_WRITE_LOCKED", { reason: guarded.reason });
      return false;
    }
    if (!guarded) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-10000)));
    }
    return true;
  }

  function mergeTrades(localRows, remoteRows) {
    const map = new Map();
    for (const row of localRows) {
      if (row?.signalKey) map.set(row.signalKey, row);
    }
    for (const remote of remoteRows) {
      if (!remote?.signalKey) continue;
      const local = map.get(remote.signalKey);
      if (!local || remote.status !== "OPEN" || local.status === "OPEN") {
        map.set(remote.signalKey, { ...local, ...remote });
      }
    }
    return [...map.values()].sort(
      (a, b) => Date.parse(a.openedAt || 0) - Date.parse(b.openedAt || 0)
    );
  }

  async function synchronize() {
    if (!isConfigured()) {
      report("SUPABASE_NOT_CONFIGURED");
      return { ok: false, reason: "SUPABASE_NOT_CONFIGURED" };
    }

    try {
      report("SUPABASE_SYNC_STARTED");
      const localBefore = getLocalTrades();
      const remoteBefore = await pullRemote();

      for (const trade of localBefore) {
        if (!trade?.signalKey) continue;
        await insertOpenTrade(trade);
        if (trade.status !== "OPEN" && trade.closedAt) await resolveTrade(trade);
      }

      const remoteAfter = await pullRemote();
      const merged = mergeTrades(localBefore, remoteAfter);
      saveLocalTrades(merged);
      global.dispatchEvent(new CustomEvent("tradelab-storage-reconcile"));

      report("SUPABASE_SYNC_SUCCESS", {
        localBefore: localBefore.length,
        remoteBefore: remoteBefore.length,
        remoteAfter: remoteAfter.length,
        merged: merged.length
      });
      return { ok: true, local: merged.length, remote: remoteAfter.length };
    } catch (error) {
      report("SUPABASE_SYNC_ERROR", { message: String(error?.message || error) });
      return { ok: false, reason: String(error?.message || error) };
    }
  }

  global.TradeLabSupabaseSync = { isConfigured, synchronize, pullRemote };
})(globalThis);

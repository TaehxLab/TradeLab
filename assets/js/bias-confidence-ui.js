(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const numberFrom = (id) => {
    const value = Number(String($(id)?.textContent || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(value) ? value : null;
  };
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function confidenceLevel(value) {
    if (value >= 75) return "HIGH";
    if (value >= 65) return "STRONG";
    if (value >= 55) return "MODERATE";
    return "LOW";
  }

  function readinessPercent() {
    const checks = [
      ["qualityH1", /REAL|PASS|READY/i],
      ["qualityM15", /REAL|PASS|READY/i],
      ["qualityM5", /REAL|PASS|READY/i],
      ["diagEntry", /AVAILABLE|PASS/i],
      ["diagInZone", /^YES$/i],
      ["diagTrigger", /CONFIRMED/i],
      ["diagRisk", /^VALID/i],
      ["diagTarget", /^VALID/i]
    ];
    let available = 0;
    let passed = 0;
    for (const [id, pattern] of checks) {
      const text = String($(id)?.textContent || "").trim();
      if (!text || text === "--") continue;
      available += 1;
      if (pattern.test(text)) passed += 1;
    }
    return available ? Math.round(passed / available * 100) : null;
  }

  function calculateBias() {
    const buyScore = numberFrom("buyScore");
    const sellScore = numberFrom("sellScore");
    if (buyScore === null || sellScore === null) return null;

    const total = buyScore + sellScore;
    if (total <= 0) return null;

    const lead = Math.abs(buyScore - sellScore);
    const rawConfidence = Math.max(buyScore, sellScore) / total * 100;
    const readiness = readinessPercent();
    const readinessFactor = readiness === null ? 1 : 0.70 + readiness / 100 * 0.30;
    const adjustedConfidence = clamp(rawConfidence * readinessFactor, 50, 99);
    const bias = lead < 5 ? "NEUTRAL" : buyScore > sellScore ? "BUY" : "SELL";

    return {
      bias,
      buyScore,
      sellScore,
      lead,
      rawConfidence: Math.round(rawConfidence),
      adjustedConfidence: Math.round(adjustedConfidence),
      readiness,
      level: confidenceLevel(adjustedConfidence)
    };
  }

  function executionText() {
    const ready = String($("qualityExecution")?.textContent || "").trim().toUpperCase();
    const blocker = String($("diagPlanBlocker")?.textContent || "").trim();
    if (ready === "READY") return "EXECUTION READY";
    return `EXECUTION WAIT${blocker && blocker !== "--" && blocker !== "NONE" ? ` • ${blocker}` : ""}`;
  }

  function render() {
    const data = calculateBias();
    const decision = $("decision");
    const action = $("action");
    if (!data || !decision || !action) return;

    decision.textContent = data.bias;
    decision.className = `decision ${data.bias.toLowerCase()}`;
    action.textContent = data.bias === "NEUTRAL"
      ? `${data.adjustedConfidence}% CONFIDENCE SCORE • ${data.level}`
      : `${data.adjustedConfidence}% CONFIDENCE SCORE • ${data.level} ${data.bias} BIAS`;

    const eyebrow = decision.closest(".decision-card")?.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = "MARKET BIAS";

    const regime = $("marketRegime");
    const readiness = $("readiness");
    const conflict = $("conflict");
    if (regime) regime.textContent = executionText();
    if (readiness) readiness.textContent = `RAW ${data.rawConfidence}% • ADJUSTED ${data.adjustedConfidence}%`;
    if (conflict) conflict.textContent = `READINESS ${data.readiness ?? "--"}% • LEAD ${data.lead}`;

    decision.closest(".decision-card")?.setAttribute("data-execution-status", executionText());
  }

  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  }

  const observer = new MutationObserver(scheduleRender);
  window.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("overview") || document.body;
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    for (const id of ["buyScore", "sellScore", "qualityExecution", "diagPlanBlocker", "diagTrigger", "diagRisk", "diagTarget"]) {
      const node = document.getElementById(id);
      if (node) observer.observe(node, { childList: true, subtree: true, characterData: true });
    }
    scheduleRender();
  });

  window.TradeLabBiasConfidence = { calculate: calculateBias, render };
})();

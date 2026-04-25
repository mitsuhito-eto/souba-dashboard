// ===== Data loader =====
// Loads /data.json (produced by scripts/fetch-data.mjs) and exposes window.DATA
// in the same shape the rest of the UI expects.

const MACRO_FMT = {
  realYield:  (x) => x.toFixed(2),
  yieldCurve: (x) => x.toFixed(0),
  m2:         (x) => x.toFixed(1),
  vix:        (x) => x.toFixed(1),
  cpi:        (x) => x.toFixed(1),
  unemp:      (x) => x.toFixed(1),
};

window.loadData = async function loadData() {
  const res = await fetch("./data.json?ts=" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error(`data.json: HTTP ${res.status}. 初回は scripts/fetch-data.mjs を実行してください。`);
  const j = await res.json();

  const MACRO = j.macro;
  for (const k in MACRO) {
    MACRO[k].fmt = MACRO_FMT[k] || ((x) => x.toFixed(1));
  }

  const pairs = j.pairs || {};
  window.DATA = {
    GENERATED_AT: j.generatedAt,
    ASSETS:       j.assets,
    SERIES:       j.series,
    SNAP:         j.snap,
    RANKED:       j.ranked,
    BUY_IDS:      new Set(j.buyIds),
    MACRO,
    VALUATION:    j.valuation,
    CORR_BTC_GLD: j.corrBtcGld,
    CORR_BTC_NDX: j.corrBtcNdx,
    BTC_HYPOTHESIS: j.btcHypothesis,
    HEATMAP:      j.heatmap,
    FX_USDJPY:    j.fxUsdJpy,
    NOW:          new Date(j.generatedAt),
    pairSeries:   (num, den) => pairs[`${num}/${den}`] || [],
    pairZ:        (num, den) => {
      if (num === den) return 0;
      const s = pairs[`${num}/${den}`];
      return s && s.length ? s[s.length - 1].z : 0;
    },
  };
};

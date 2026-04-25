// Fetches market + macro data, computes Z-scores / correlations / pair ratios,
// outputs data.json consumed by the dashboard.
//
// Sources: Stooq (prices), FRED (macro). All free, FRED requires a key.
//
// Run:    node scripts/fetch-data.mjs
// Output: ./data.json

import { writeFile } from "node:fs/promises";

const ASSETS = [
  { id: "NDX", name: "NASDAQ100", color: "#00d4ff", unit: "USD",    yahoo: "^NDX" },
  { id: "GLD", name: "Gold",      color: "#ffd700", unit: "USD/oz", yahoo: "GLD" },
  { id: "BTC", name: "BTC",       color: "#ff9933", unit: "USD",    yahoo: "BTC-USD" },
  { id: "TLT", name: "TLT",       color: "#9b8cff", unit: "USD",    yahoo: "TLT" },
];

const FX_SYMBOL = "JPY=X";
const UA = "Mozilla/5.0 (souba-dashboard fetch-data)";

// ---------- HTTP helpers ----------
async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}
async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ---------- Yahoo Finance weekly chart ----------
// Returns [{ t: "YYYY-MM-DD", p: close }] sorted ascending.
async function fetchYahooWeekly(symbol, range = "10y") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=${range}`;
  const j = await fetchJson(url);
  const r = j.chart?.result?.[0];
  if (!r) throw new Error(`Yahoo: no result for ${symbol}`);
  const ts = r.timestamp || [];
  const closes = r.indicators?.quote?.[0]?.close || [];
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const p = closes[i];
    if (p == null || !isFinite(p)) continue;
    const t = new Date(ts[i] * 1000).toISOString().slice(0, 10);
    out.push({ t, p });
  }
  // Dedupe by date (keep last) and sort
  const m = new Map();
  for (const d of out) m.set(d.t, d.p);
  return [...m.entries()].sort().map(([t, p]) => ({ t, p }));
}

// ---------- FRED ----------
async function fetchFred(seriesId, apiKey) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
  const json = await fetchJson(url);
  const out = [];
  for (const ob of json.observations || []) {
    if (!ob.value || ob.value === ".") continue;
    const v = parseFloat(ob.value);
    if (!isFinite(v)) continue;
    out.push({ t: ob.date, v });
  }
  return out;
}

// ---------- Stats ----------
// Z-score on log prices: robust for exponential assets like BTC.
function withStats(series) {
  const out = series.map((d, i) => ({ i, t: d.t, p: d.p }));
  const N = 200;
  for (let i = 0; i < out.length; i++) {
    const lo = Math.max(0, i - N + 1);
    const slice = out.slice(lo, i + 1);
    const logs = slice.map((x) => Math.log(x.p));
    const mean = logs.reduce((s, x) => s + x, 0) / logs.length;
    const variance = logs.reduce((s, x) => s + (x - mean) ** 2, 0) / logs.length;
    const sd = Math.sqrt(variance);
    out[i].ma = Math.exp(mean);
    out[i].sd = sd;
    out[i].upper1 = Math.exp(mean + sd);
    out[i].upper2 = Math.exp(mean + 2 * sd);
    out[i].lower1 = Math.exp(mean - sd);
    out[i].lower2 = Math.exp(mean - 2 * sd);
    out[i].z = sd > 0 ? (Math.log(out[i].p) - mean) / sd : 0;
  }
  let peak = -Infinity;
  for (let i = 0; i < out.length; i++) {
    peak = Math.max(peak, out[i].p);
    out[i].dd = (out[i].p / peak - 1) * 100;
  }
  return out;
}

function snapshot(s) {
  const last = s[s.length - 1];
  const prev = s[s.length - 2] ?? last;
  const wk52 = s[s.length - 53] ?? s[0];
  return {
    price: last.p, z: last.z, ma: last.ma,
    upper1: last.upper1, upper2: last.upper2,
    lower1: last.lower1, lower2: last.lower2,
    chg1w: (last.p / prev.p - 1) * 100,
    chg52w: (last.p / wk52.p - 1) * 100,
    dd: last.dd,
  };
}

function rollingCorr(a, b, win = 13) {
  const out = [];
  for (let i = 0; i < a.length; i++) {
    if (i < win) { out.push({ i, t: a[i].t, c: null }); continue; }
    const ra = [], rb = [];
    for (let k = i - win + 1; k <= i; k++) {
      ra.push(Math.log(a[k].p / a[k - 1].p));
      rb.push(Math.log(b[k].p / b[k - 1].p));
    }
    const ma = ra.reduce((s, x) => s + x, 0) / ra.length;
    const mb = rb.reduce((s, x) => s + x, 0) / rb.length;
    let num = 0, da = 0, db = 0;
    for (let k = 0; k < ra.length; k++) {
      num += (ra[k] - ma) * (rb[k] - mb);
      da += (ra[k] - ma) ** 2;
      db += (rb[k] - mb) ** 2;
    }
    out.push({ i, t: a[i].t, c: num / Math.sqrt(da * db || 1) });
  }
  return out;
}

function pairSeries(a, b) {
  const n = Math.min(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) out.push({ i, t: a[i].t, r: a[i].p / b[i].p });
  const mean = out.reduce((s, x) => s + x.r, 0) / out.length;
  const sd = Math.sqrt(out.reduce((s, x) => s + (x.r - mean) ** 2, 0) / out.length);
  for (const o of out) {
    o.mean = mean;
    o.upper1 = mean + sd;     o.upper2 = mean + 2 * sd;
    o.lower1 = mean - sd;     o.lower2 = mean - 2 * sd;
    o.z = sd > 0 ? (o.r - mean) / sd : 0;
  }
  return out;
}

function alignSeries(map) {
  const ids = Object.keys(map);
  let dates = new Set(map[ids[0]].map((d) => d.t));
  for (const id of ids.slice(1)) {
    const s = new Set(map[id].map((d) => d.t));
    dates = new Set([...dates].filter((x) => s.has(x)));
  }
  const sortedDates = [...dates].sort();
  const aligned = {};
  for (const id of ids) {
    const m = new Map(map[id].map((d) => [d.t, d.p]));
    aligned[id] = sortedDates.map((t, i) => ({ i, t, p: m.get(t) }));
  }
  return aligned;
}

// ---------- Macro ----------
function monthlyLast(daily, monthsCount) {
  const m = new Map();
  for (const d of daily) m.set(d.t.slice(0, 7), d.v);
  const ks = [...m.keys()].sort().slice(-monthsCount);
  return ks.map((k, i) => ({ i, v: m.get(k) }));
}

function yoy(monthly, monthsCount) {
  const m = new Map(monthly.map((d) => [d.t.slice(0, 7), d.v]));
  const ks = [...m.keys()].sort();
  const out = [];
  for (let i = 12; i < ks.length; i++) {
    const k = ks[i], k12 = ks[i - 12];
    const v = m.get(k), v12 = m.get(k12);
    if (v == null || v12 == null || v12 === 0) continue;
    out.push({ v: (v / v12 - 1) * 100 });
  }
  return out.slice(-monthsCount).map((d, i) => ({ i, v: d.v }));
}

function alignedSubtractDaily(a, b) {
  const m = new Map(b.map((d) => [d.t, d.v]));
  return a.filter((d) => m.has(d.t)).map((d) => ({ t: d.t, v: d.v - m.get(d.t) }));
}

async function buildMacro(apiKey) {
  const out = {
    realYield:  { label: "US Real Yield (10Y)",  unit: "%",  series: [] },
    yieldCurve: { label: "Yield Curve (10Y-2Y)", unit: "bp", series: [] },
    m2:         { label: "M2 YoY Growth",        unit: "%",  series: [] },
    vix:        { label: "VIX",                  unit: "",   series: [] },
    cpi:        { label: "CPI YoY",              unit: "%",  series: [] },
    unemp:      { label: "Unemployment Rate",    unit: "%",  series: [] },
  };

  if (!apiKey) {
    console.warn("  FRED_API_KEY not set — using fallback macro values");
    return fallbackMacro(out);
  }

  try {
    console.log("  FRED: DFII10");
    const dfii10 = await fetchFred("DFII10", apiKey);
    out.realYield.series = monthlyLast(dfii10, 60);

    console.log("  FRED: DGS10, DGS2");
    const dgs10 = await fetchFred("DGS10", apiKey);
    const dgs2 = await fetchFred("DGS2", apiKey);
    const yc = alignedSubtractDaily(dgs10, dgs2);
    out.yieldCurve.series = monthlyLast(yc, 60).map((d) => ({ ...d, v: d.v * 100 }));

    console.log("  FRED: M2SL");
    const m2 = await fetchFred("M2SL", apiKey);
    out.m2.series = yoy(m2, 60);

    console.log("  FRED: VIXCLS");
    const vix = await fetchFred("VIXCLS", apiKey);
    out.vix.series = monthlyLast(vix, 60);

    console.log("  FRED: CPIAUCSL");
    const cpi = await fetchFred("CPIAUCSL", apiKey);
    out.cpi.series = yoy(cpi, 60);

    console.log("  FRED: UNRATE");
    const unrate = await fetchFred("UNRATE", apiKey);
    out.unemp.series = monthlyLast(unrate, 60);

    for (const k in out) {
      out[k].series = out[k].series.map((d, i) => ({ i, v: d.v }));
    }
  } catch (e) {
    console.warn("  FRED fetch failed:", e.message, "— using fallback");
    return fallbackMacro(out);
  }

  return out;
}

function fallbackMacro(out) {
  const n = 60;
  const filler = (start, drift, vol, last) => {
    const arr = [];
    for (let i = 0; i < n - 1; i++) {
      const v = start + drift * i + vol * (Math.sin(i * 0.7) + Math.cos(i * 0.4)) * 0.5;
      arr.push({ i, v });
    }
    arr.push({ i: n - 1, v: last });
    return arr;
  };
  out.realYield.series  = filler(-0.5, 0.04, 0.3, 1.84);
  out.yieldCurve.series = filler(50, -1, 10, 42);
  out.m2.series         = filler(6.0, 0.02, 0.5, 4.6);
  out.vix.series        = filler(18, 0, 3, 16.8);
  out.cpi.series        = filler(2.1, 0.02, 0.3, 2.8);
  out.unemp.series      = filler(3.7, 0.005, 0.1, 4.1);
  return out;
}

// ---------- Valuation cards ----------
function lastVal(s) { return s.length ? s[s.length - 1].v : null; }
function fmtPct(v, dp = 0) { return (v >= 0 ? "+" : "") + v.toFixed(dp) + "%"; }
function stateOfZ(z) { return z >= 1 ? "rich" : z <= -1 ? "cheap" : "neutral"; }

function buildValuation(SNAP, MACRO) {
  const btcMayer = SNAP.BTC.price / SNAP.BTC.ma;
  const ry = lastVal(MACRO.realYield.series);
  return {
    NDX: [
      { k: "vs 200wMA",   v: fmtPct((SNAP.NDX.price / SNAP.NDX.ma - 1) * 100), note: "premium",        state: stateOfZ(SNAP.NDX.z) },
      { k: "Z-score",     v: SNAP.NDX.z.toFixed(2) + "σ",                       note: "log-detrended",  state: stateOfZ(SNAP.NDX.z) },
      { k: "DD from peak",v: SNAP.NDX.dd.toFixed(0) + "%",                      note: "drawdown",       state: SNAP.NDX.dd <= -20 ? "cheap" : "neutral" },
    ],
    GLD: [
      { k: "vs 200wMA",   v: fmtPct((SNAP.GLD.price / SNAP.GLD.ma - 1) * 100), note: "premium",        state: stateOfZ(SNAP.GLD.z) },
      { k: "Z-score",     v: SNAP.GLD.z.toFixed(2) + "σ",                       note: "log-detrended",  state: stateOfZ(SNAP.GLD.z) },
      { k: "DD from peak",v: SNAP.GLD.dd.toFixed(0) + "%",                      note: "drawdown",       state: SNAP.GLD.dd <= -20 ? "cheap" : "neutral" },
    ],
    BTC: [
      { k: "Mayer Mult.", v: btcMayer.toFixed(2),                                note: "P / 200wMA",     state: btcMayer >= 1.5 ? "rich" : btcMayer <= 0.8 ? "cheap" : "neutral" },
      { k: "Z-score",     v: SNAP.BTC.z.toFixed(2) + "σ",                        note: "log-detrended",  state: stateOfZ(SNAP.BTC.z) },
      { k: "DD from peak",v: SNAP.BTC.dd.toFixed(0) + "%",                       note: "drawdown",       state: SNAP.BTC.dd <= -40 ? "cheap" : "neutral" },
    ],
    TLT: [
      { k: "Real Yield",  v: ry == null ? "—" : ry.toFixed(2) + "%",             note: "10Y TIPS",       state: ry != null && ry >= 2 ? "cheap" : "neutral" },
      { k: "Z-score",     v: SNAP.TLT.z.toFixed(2) + "σ",                        note: "log-detrended",  state: stateOfZ(SNAP.TLT.z) },
      { k: "DD from peak",v: SNAP.TLT.dd.toFixed(0) + "%",                       note: "drawdown",       state: SNAP.TLT.dd <= -30 ? "cheap" : "neutral" },
    ],
  };
}

// ---------- Main ----------
async function main() {
  const t0 = Date.now();
  console.log("[fetch-data] start");

  const seriesRaw = {};
  for (const a of ASSETS) {
    process.stdout.write(`  Yahoo: ${a.id.padEnd(4)} (${a.yahoo}) ... `);
    seriesRaw[a.id] = await fetchYahooWeekly(a.yahoo);
    console.log(`${seriesRaw[a.id].length} bars`);
  }

  for (const id in seriesRaw) seriesRaw[id] = seriesRaw[id].slice(-520);
  const aligned = alignSeries(seriesRaw);
  console.log(`  Aligned: ${aligned[ASSETS[0].id].length} weeks across ${ASSETS.length} assets`);

  const SERIES = {};
  for (const id in aligned) SERIES[id] = withStats(aligned[id]);

  const SNAP = {};
  for (const id in SERIES) SNAP[id] = snapshot(SERIES[id]);

  const RANKED = ASSETS.map((a) => ({ ...a, ...SNAP[a.id] })).sort((x, y) => x.z - y.z);
  const BUY_IDS = [RANKED[0].id, RANKED[1].id];

  const CORR_BTC_GLD = rollingCorr(SERIES.BTC, SERIES.GLD);
  const CORR_BTC_NDX = rollingCorr(SERIES.BTC, SERIES.NDX);
  const cGold = CORR_BTC_GLD.at(-1)?.c ?? null;
  const cNdx  = CORR_BTC_NDX.at(-1)?.c ?? null;
  const BTC_HYPOTHESIS = {
    cGold, cNdx,
    intact: cGold != null && cNdx != null && (cGold - cNdx) >= 0.10,
  };

  const PAIRS = {};
  for (const a of ASSETS) for (const b of ASSETS) {
    if (a.id === b.id) continue;
    PAIRS[`${a.id}/${b.id}`] = pairSeries(SERIES[a.id], SERIES[b.id]);
  }
  const HEATMAP = ASSETS.map((row) =>
    ASSETS.map((col) => ({
      num: row.id, den: col.id,
      z: row.id === col.id ? null : PAIRS[`${row.id}/${col.id}`].at(-1).z,
    }))
  );

  const MACRO = await buildMacro(process.env.FRED_API_KEY || "");
  const VALUATION = buildValuation(SNAP, MACRO);

  let fx = 152.4;
  try {
    const s = await fetchYahooWeekly(FX_SYMBOL, "1y");
    fx = s.at(-1).p;
    console.log(`  USD/JPY: ${fx.toFixed(2)}`);
  } catch (e) {
    console.warn(`  USD/JPY fetch failed: ${e.message}, using fallback ${fx}`);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    assets: ASSETS,
    series: SERIES,
    snap: SNAP,
    ranked: RANKED,
    buyIds: BUY_IDS,
    macro: MACRO,
    valuation: VALUATION,
    corrBtcGld: CORR_BTC_GLD,
    corrBtcNdx: CORR_BTC_NDX,
    btcHypothesis: BTC_HYPOTHESIS,
    pairs: PAIRS,
    heatmap: HEATMAP,
    fxUsdJpy: fx,
  };

  const json = JSON.stringify(out);
  await writeFile("./data.json", json);
  console.log(`[fetch-data] wrote data.json (${(json.length / 1024).toFixed(1)} KB) in ${(Date.now() - t0) / 1000}s`);
  console.log(`[fetch-data] BUY: ${BUY_IDS.join(" + ")} | BTC HYP: ${BTC_HYPOTHESIS.intact ? "INTACT" : "BREAKING"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

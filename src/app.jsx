// ===== App shell =====
const { useState, useEffect } = React;

const TABS = [
  { id: "rec",    label: "推奨",     en: "RECOMMEND" },
  { id: "chart",  label: "チャート", en: "CHARTS" },
  { id: "regime", label: "レジーム", en: "REGIME" },
  { id: "ratio",  label: "比率",     en: "RATIOS" },
];

function App() {
  const [tab, setTab] = useState("rec");
  const [ccy, setCcy] = useState("USD");

  const buys = window.DATA.RANKED.slice(0, 2).map((b) => b.id).join(" + ");
  const generated = window.DATA.GENERATED_AT
    ? new Date(window.DATA.GENERATED_AT)
    : new Date();

  // Regime label inferred from CPI YoY + unemployment trend (simple heuristic)
  const regimeLabel = inferRegime();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--grid)" }}>
        <div className="px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, background: "var(--buy)", boxShadow: "0 0 8px var(--buy)" }}></div>
              <div className="mono font-bold" style={{ fontSize: 13, letterSpacing: "0.12em" }}>
                PORTFOLIO MONITOR
              </div>
            </div>
            <div className="label-xs ml-3 pl-3" style={{ borderLeft: "1px solid var(--grid)" }}>
              v0.5 · PERSONAL
            </div>
          </div>

          <nav className="flex gap-7">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className={`tab pb-3 -mb-px ${tab === t.id ? "on" : ""}`}>
                <span className="mr-2">{t.label}</span>
                <span style={{ opacity: 0.5, fontSize: 10 }}>{t.en}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="live-dot"></div>
              <span className="mono text-d1" style={{ fontSize: 11 }}>
                LAST UPDATE {generated.toISOString().slice(0, 10)} {generated.toISOString().slice(11, 19)} UTC
              </span>
            </div>
            <div className="flex" style={{ border: "1px solid var(--grid)" }}>
              {["USD", "JPY"].map((c) => (
                <button key={c} onClick={() => setCcy(c)}
                        className="mono px-3 py-1"
                        style={{
                          fontSize: 11,
                          color: ccy === c ? "var(--buy)" : "var(--text-2)",
                          background: ccy === c ? "rgba(0,255,136,0.06)" : "transparent",
                        }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 h-8 flex items-center gap-6 text-xs" style={{ borderTop: "1px solid var(--grid)", background: "var(--bg-0)" }}>
          <div className="flex items-center gap-2">
            <span className="label-xs">TODAY'S BUY</span>
            <span className="mono font-bold" style={{ color: "var(--buy)", fontSize: 12 }}>{buys}</span>
            <span className="label-xs">· 50/50</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="label-xs">REGIME</span>
            <span className="mono" style={{ color: "var(--warn)", fontSize: 11 }}>{regimeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="label-xs">BTC HYP</span>
            <span className="mono" style={{ color: window.DATA.BTC_HYPOTHESIS.intact ? "var(--buy)" : "var(--warn)", fontSize: 11 }}>
              {window.DATA.BTC_HYPOTHESIS.intact ? "INTACT" : "BREAKING"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="label-xs">USD/JPY</span>
            <span className="mono text-d0" style={{ fontSize: 11 }}>{window.DATA.FX_USDJPY.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="px-6 py-5">
        {tab === "rec" && <window.TabRecommend ccy={ccy} />}
        {tab === "chart" && <window.TabCharts ccy={ccy} />}
        {tab === "regime" && <window.TabRegime ccy={ccy} regimeLabel={regimeLabel} />}
        {tab === "ratio" && <window.TabRatios ccy={ccy} />}
      </main>

      <footer className="px-6 py-3 mono text-d3" style={{ fontSize: 10, borderTop: "1px solid var(--grid)" }}>
        STRATEGY: 4-ASSET Z-SCORE BOTTOM-2 EQUAL-WEIGHT · CASH = TRASH · DATA: STOOQ + FRED ·
        ※ 投資判断は自己責任。
      </footer>
    </div>
  );
}

function inferRegime() {
  const m = window.DATA.MACRO;
  const cpi = m.cpi.series.at(-1)?.v ?? 2;
  const unemp = m.unemp.series.at(-1)?.v ?? 4;
  const unempPrev = m.unemp.series.at(-7)?.v ?? unemp;
  const unempTrend = unemp - unempPrev;

  const inflPart = cpi >= 3 ? "高インフレ" : cpi >= 2 ? "インフレ" : cpi >= 0 ? "ディスインフレ" : "デフレ";
  const cyclePart = unempTrend >= 0.5 ? "後退" : unempTrend <= -0.3 ? "拡大" : "中立";
  return `${inflPart}・${cyclePart}期`;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      <div className="text-center">
        <div className="live-dot mx-auto mb-3" style={{ width: 8, height: 8 }}></div>
        <div className="mono" style={{ fontSize: 12, letterSpacing: "0.1em" }}>LOADING DATA...</div>
      </div>
    </div>
  );
}

function ErrorScreen({ msg }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg-0)", color: "var(--text-0)" }}>
      <div className="panel p-6 max-w-xl">
        <div className="label-xs mb-3" style={{ color: "var(--sell)" }}>ERROR LOADING DATA</div>
        <div className="mono text-sm leading-relaxed">{msg}</div>
        <div className="mt-4 mono text-xs text-d2 leading-relaxed">
          初回起動時は <span style={{ color: "var(--info)" }}>npm run fetch</span> を実行して data.json を生成してください。
        </div>
      </div>
    </div>
  );
}

function Root() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    window.loadData().then(() => setReady(true)).catch((e) => setErr(e.message || String(e)));
  }, []);

  if (err) return <ErrorScreen msg={err} />;
  if (!ready) return <LoadingScreen />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

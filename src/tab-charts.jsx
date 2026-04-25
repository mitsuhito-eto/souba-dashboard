// ===== Tab 2: チャート =====
const { fmtNum: f2, fmtPct: fpc2, fmtZ: fz2, fmtCcy: fc2, ASSET_COLOR: AC2 } = window.ATOMS;

function TabCharts({ ccy }) {
  const [period, setPeriod] = React.useState("5Y");
  const [logScale, setLogScale] = React.useState(false);
  const fx = window.DATA.FX_USDJPY;
  const periods = ["3M", "6M", "1Y", "3Y", "5Y", "10Y", "All"];

  return (
    <div className="tab-pane">
      {/* Controls */}
      <div className="panel mb-4 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="label-xs">PERIOD</div>
          <div className="seg flex gap-px">
            {periods.map((p) => (
              <button key={p} className={`mono px-3 py-1.5 ${period === p ? "on" : ""}`} style={{ fontSize: 11 }}
                      onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <div className="label-xs ml-1" style={{ fontSize: 9, color: "var(--text-3)" }}>
            ※ 週次データ・長期投資向け
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Toggle label="LOG" active={logScale} onClick={() => setLogScale(!logScale)} />
        </div>
      </div>

      {/* 2x2 chart grid */}
      <div className="grid grid-cols-2 gap-4">
        {window.DATA.ASSETS.map((a) => {
          const snap = window.DATA.SNAP[a.id];
          const isBuy = window.DATA.BUY_IDS.has(a.id);
          return (
            <div key={a.id} className="panel">
              <div className="flex items-baseline justify-between px-5 py-3 border-b divider">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5" style={{ background: AC2[a.id] }}></div>
                  <div className="mono text-base font-bold text-d0">{a.name}</div>
                  <div className="label-xs">{a.id}</div>
                  {isBuy && <span className="label-xs px-1.5 py-0.5" style={{ color: "var(--buy)", border: "1px solid rgba(0,255,136,0.4)" }}>BUY</span>}
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="text-right">
                    <div className="mono text-base font-bold text-d0">
                      {fc2(snap.price, ccy, fx, a.id === "BTC" ? 0 : 2)}
                    </div>
                    <div className="label-xs" style={{ fontSize: 9 }}>LAST</div>
                  </div>
                  <div className="text-right" style={{ minWidth: 60 }}>
                    <div className="mono text-sm" style={{ color: snap.chg1w >= 0 ? "var(--buy)" : "var(--sell)" }}>
                      {fpc2(snap.chg1w, 2)}
                    </div>
                    <div className="label-xs" style={{ fontSize: 9 }}>1W</div>
                  </div>
                  <div className="text-right" style={{ minWidth: 60 }}>
                    <div className="mono text-sm" style={{ color: fz2(snap.z), color: snap.z >= 0.5 ? "var(--sell)" : (snap.z <= -0.5 ? "var(--buy)" : "var(--text-1)") }}>
                      {fz2(snap.z)}
                    </div>
                    <div className="label-xs" style={{ fontSize: 9 }}>Z</div>
                  </div>
                </div>
              </div>
              <div className="px-3 pt-2 pb-3">
                <window.CHARTS.PriceChart assetId={a.id} period={period} logScale={logScale} height={220} showDD={true} />
              </div>
              <div className="flex items-center gap-4 px-5 py-2 border-t divider label-xs" style={{ fontSize: 10 }}>
                <span className="flex items-center gap-1.5"><span style={{ display: "inline-block", width: 12, height: 1.5, background: AC2[a.id] }}></span>PRICE</span>
                <span className="flex items-center gap-1.5"><span style={{ display: "inline-block", width: 12, height: 1, borderTop: "1px dashed #9aa3b8" }}></span>200wMA</span>
                <span className="flex items-center gap-1.5"><span style={{ display: "inline-block", width: 12, height: 4, background: AC2[a.id], opacity: 0.3 }}></span>±1σ ±2σ</span>
                <span className="flex items-center gap-1.5"><span style={{ display: "inline-block", width: 12, height: 4, background: "#ff3366", opacity: 0.4 }}></span>DRAWDOWN</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-1.5 border"
            style={{ borderColor: active ? "rgba(0,212,255,0.5)" : "var(--grid)",
                     background: active ? "rgba(0,212,255,0.06)" : "transparent" }}>
      <span style={{
        display: "inline-block", width: 8, height: 8, borderRadius: 1,
        background: active ? "var(--info)" : "var(--text-3)",
      }}></span>
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em",
                                       color: active ? "var(--info)" : "var(--text-1)" }}>{label}</span>
    </button>
  );
}

window.TabCharts = TabCharts;

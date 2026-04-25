// ===== Tab 3: レジーム =====
const { fmtNum: f3, fmtPct: fpc3, Spark: Spark3, RangeBar: RangeBar3, ASSET_COLOR: AC3 } = window.ATOMS;

function TabRegime({ ccy }) {
  const macro = window.DATA.MACRO;
  const macroOrder = ["realYield", "yieldCurve", "m2", "vix", "cpi", "unemp"];
  const hyp = window.DATA.BTC_HYPOTHESIS;

  return (
    <div className="tab-pane">
      {/* Top: Macro 6 + regime badge */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-9 grid grid-cols-3 gap-px panel" style={{ background: "var(--grid)" }}>
          {macroOrder.map((k) => <MacroCard key={k} k={k} m={macro[k]} />)}
        </div>
        <div className="col-span-3 panel p-5 flex flex-col">
          <div className="label-xs">CURRENT REGIME</div>
          <div className="mt-2">
            <span className="regime-badge inline-block">インフレ・拡大期</span>
          </div>
          <div className="mt-4 mono text-xs text-d1 leading-relaxed">
            CPI 2.8% / 失業率 4.1% / イールドカーブ 正常化。<br/>
            ディスインフレ進行中、後退入りは未確認。
          </div>
          <div className="mt-auto pt-4 border-t divider">
            <div className="label-xs">SIGNAL MIX</div>
            <div className="mono text-xs text-d0 mt-1">Risk-On 偏重</div>
            <div className="flex gap-1 mt-2">
              <div style={{ flex: 3, height: 4, background: "var(--buy)" }}></div>
              <div style={{ flex: 1, height: 4, background: "var(--sell)" }}></div>
            </div>
            <div className="flex justify-between label-xs mt-1" style={{ fontSize: 9 }}>
              <span>Risk-On 75%</span>
              <span>Risk-Off 25%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mid: Absolute valuation per asset */}
      <div className="panel mb-4">
        <div className="px-5 py-3 border-b divider flex items-baseline justify-between">
          <div className="label-xs" style={{ color: "var(--text-0)" }}>ABSOLUTE VALUATION · PER ASSET</div>
          <div className="label-xs">2026-04-25</div>
        </div>
        <div className="grid grid-cols-4 gap-px" style={{ background: "var(--grid)" }}>
          {window.DATA.ASSETS.map((a) => {
            const rows = window.DATA.VALUATION[a.id];
            return (
              <div key={a.id} className="p-5" style={{ background: "var(--bg-panel)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5" style={{ background: AC3[a.id] }}></div>
                  <div className="mono text-sm font-bold text-d0">{a.name}</div>
                </div>
                <div className="space-y-3">
                  {rows.map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between">
                      <div>
                        <div className="mono text-xs text-d1">{r.k}</div>
                        <div className="label-xs" style={{ fontSize: 9 }}>{r.note}</div>
                      </div>
                      <div className="mono text-sm font-bold" style={{
                        color: r.state === "rich" ? "var(--sell)" : r.state === "cheap" ? "var(--buy)" : "var(--text-0)"
                      }}>{r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: BTC hypothesis */}
      <div className="panel" style={{
        borderColor: hyp.intact ? "var(--grid)" : "rgba(255, 215, 0, 0.5)",
        boxShadow: hyp.intact ? "none" : "0 0 0 1px rgba(255,215,0,0.3) inset",
      }}>
        <div className="px-5 py-3 border-b divider flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <div className="label-xs" style={{ color: hyp.intact ? "var(--text-0)" : "var(--warn)" }}>
              HYPOTHESIS · "BTC = DIGITAL GOLD?"
            </div>
            {!hyp.intact && (
              <span className="label-xs" style={{ color: "var(--warn)" }}>⚠ 仮説が崩れている可能性</span>
            )}
          </div>
          <div className="label-xs">90日ローリング相関</div>
        </div>
        <div className="grid grid-cols-12 gap-4 p-5">
          <div className="col-span-4 flex flex-col">
            <div className="mb-4">
              <div className="label-xs mb-1">BTC vs GOLD CORR</div>
              <div className="mono text-3xl font-bold" style={{ color: AC3.GLD }}>
                {hyp.cGold >= 0 ? "+" : ""}{f3(hyp.cGold, 2)}
              </div>
            </div>
            <div className="mb-4">
              <div className="label-xs mb-1">BTC vs NDX CORR</div>
              <div className="mono text-3xl font-bold" style={{ color: AC3.NDX }}>
                {hyp.cNdx >= 0 ? "+" : ""}{f3(hyp.cNdx, 2)}
              </div>
            </div>
            <div className="mt-auto pt-4 border-t divider">
              <div className="label-xs mb-2">VERDICT</div>
              <div className="mono text-xs leading-relaxed text-d0">
                BTCは Gold相関 <span className="font-bold" style={{ color: AC3.GLD }}>{f3(hyp.cGold, 2)}</span>,
                NASDAQ相関 <span className="font-bold" style={{ color: AC3.NDX }}>{f3(hyp.cNdx, 2)}</span> →
                <br/>現在は <span className="font-bold" style={{ color: hyp.intact ? "var(--buy)" : "var(--warn)" }}>
                  [{hyp.intact ? "Digital Gold" : "テック資産"}]
                </span> として振る舞っています。
              </div>
            </div>
          </div>
          <div className="col-span-8 grid grid-cols-1 gap-3">
            <div>
              <div className="flex items-baseline justify-between mb-1 px-2">
                <div className="label-xs"><span style={{ color: AC3.GLD }}>■</span> BTC × GOLD</div>
                <div className="mono text-xs text-d1">last 200w</div>
              </div>
              <window.CHARTS.CorrChart data={window.DATA.CORR_BTC_GLD} color={AC3.GLD} label="BTC×GOLD" height={130} />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1 px-2">
                <div className="label-xs"><span style={{ color: AC3.NDX }}>■</span> BTC × NASDAQ100</div>
                <div className="mono text-xs text-d1">last 200w</div>
              </div>
              <window.CHARTS.CorrChart data={window.DATA.CORR_BTC_NDX} color={AC3.NDX} label="BTC×NDX" height={130} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroCard({ k, m }) {
  const last = m.series[m.series.length - 1].v;
  const prevM = m.series[m.series.length - 2].v;
  const prevY = m.series[m.series.length - 13]?.v ?? last;
  const dM = last - prevM;
  const dY = last - prevY;
  const ys = m.series.map((d) => d.v);
  const min = Math.min(...ys), max = Math.max(...ys);
  const lastSign = dM >= 0;
  return (
    <div className="p-4" style={{ background: "var(--bg-panel)" }}>
      <div className="label-xs mb-2">{m.label}</div>
      <div className="flex items-end justify-between mb-3">
        <div className="mono text-2xl font-bold text-d0">
          {m.fmt(last)}<span className="text-d2 text-sm ml-1">{m.unit}</span>
        </div>
        <Spark3 data={m.series.map((d) => d.v)} color={lastSign ? "var(--buy)" : "var(--sell)"} width={70} height={24} fill={true} />
      </div>
      <div className="flex items-center gap-4 mb-3 mono text-xs">
        <span className="text-d2">MoM</span>
        <span style={{ color: dM >= 0 ? "var(--buy)" : "var(--sell)" }}>
          {dM >= 0 ? "+" : ""}{f3(dM, 2)}
        </span>
        <span className="text-d2 ml-2">YoY</span>
        <span style={{ color: dY >= 0 ? "var(--buy)" : "var(--sell)" }}>
          {dY >= 0 ? "+" : ""}{f3(dY, 2)}
        </span>
      </div>
      <div>
        <RangeBar3 value={last} min={min} max={max} />
        <div className="flex justify-between label-xs mt-1.5" style={{ fontSize: 9 }}>
          <span>{m.fmt(min)}</span>
          <span className="text-d3">5Y RANGE</span>
          <span>{m.fmt(max)}</span>
        </div>
      </div>
    </div>
  );
}

window.TabRegime = TabRegime;

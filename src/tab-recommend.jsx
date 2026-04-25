// ===== Tab 1: 推奨 =====
const { fmtNum: f1, fmtPrice: fp1, fmtPct: fpc1, fmtZ: fz1, fmtCcy: fc1, ZMeter: ZMeter1, ASSET_COLOR: AC1 } = window.ATOMS;

function TabRecommend({ ccy }) {
  const fx = window.DATA.FX_USDJPY;
  const ranked = window.DATA.RANKED;
  const buys = ranked.slice(0, 2);
  const buySet = new Set(buys.map((b) => b.id));

  return (
    <div className="tab-pane">
      {/* TOP: TODAY'S ALLOCATION */}
      <div className="panel-hi p-6 mb-4" style={{ borderColor: "rgba(0,255,136,0.3)" }}>
        <div className="flex items-baseline justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="live-dot"></div>
            <div className="label-xs" style={{ color: "var(--buy)", fontSize: 11 }}>TODAY'S ALLOCATION</div>
            <div className="label-xs">次の1万円をどこに入れるか</div>
          </div>
          <div className="label-xs">Z-SCORE 下位2資産に均等配分</div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Donut visualisation */}
          <div className="col-span-3 flex items-center justify-center">
            <AllocationDonut buys={buys} ccy={ccy} />
          </div>

          {/* Two big BUY tiles */}
          <div className="col-span-6 grid grid-cols-2 gap-4">
            {buys.map((a) => (
              <div key={a.id} className="relative p-5 ring-buy glow-buy" style={{ background: "rgba(0,255,136,0.04)" }}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="label-xs" style={{ color: "var(--buy)" }}>BUY · 50%</div>
                    <div className="mono text-2xl font-bold mt-1" style={{ color: AC1[a.id] }}>{a.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-lg font-bold" style={{ color: "var(--buy)" }}>{fz1(a.z)}</div>
                    <div className="label-xs">z-score</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-baseline">
                  <div>
                    <div className="label-xs">PRICE</div>
                    <div className="mono text-base text-d0">{fc1(a.price, ccy, fx, a.id === "BTC" ? 0 : 2)}</div>
                  </div>
                  <div>
                    <div className="label-xs">52W</div>
                    <div className="mono text-sm" style={{ color: a.chg52w >= 0 ? "var(--buy)" : "var(--sell)" }}>
                      {fpc1(a.chg52w, 1)}
                    </div>
                  </div>
                  <div>
                    <div className="label-xs">DD</div>
                    <div className="mono text-sm text-sell">{fpc1(a.dd, 1, false)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Two HOLD tiles */}
          <div className="col-span-3 flex flex-col gap-3 justify-center">
            {ranked.slice(2, 4).map((a) => (
              <div key={a.id} className="panel p-3" style={{ opacity: 0.6 }}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="label-xs">HOLD · 0%</div>
                    <div className="mono text-sm font-bold text-d1">{a.name}</div>
                  </div>
                  <div className="mono text-xs" style={{ color: a.z >= 0 ? "var(--sell)" : "var(--text-1)" }}>{fz1(a.z)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MID: Z-score meters */}
      <div className="panel mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b divider">
          <div className="label-xs" style={{ color: "var(--text-0)" }}>Z-SCORE METER · 4 ASSETS</div>
          <div className="label-xs" title="Z-score = (現在値 - 200週MA) ÷ 標準偏差">
            ƒ(x) = (P − MA<sub>200w</sub>) ÷ σ
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--grid)" }}>
          {ranked.map((a, idx) => {
            const isBuy = buySet.has(a.id);
            return (
              <div key={a.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4"
                   style={{ borderColor: "var(--grid)", borderTopWidth: idx === 0 ? 0 : 1, borderTopStyle: "solid" }}>
                <div className="col-span-2 flex items-center gap-3">
                  <div className="mono text-xs text-d3 w-4">#{idx + 1}</div>
                  <div className="w-1.5 h-6" style={{ background: AC1[a.id], opacity: isBuy ? 1 : 0.4 }}></div>
                  <div>
                    <div className="mono text-base font-bold" style={{ color: isBuy ? "var(--text-0)" : "var(--text-1)" }}>{a.name}</div>
                    <div className="label-xs">{a.id}</div>
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="label-xs">Z-SCORE</div>
                  <div className="mono text-lg font-bold" style={{ color: isBuy ? "var(--buy)" : (a.z >= 0.5 ? "var(--sell)" : "var(--text-1)") }}>
                    {fz1(a.z)}
                  </div>
                </div>
                <div className="col-span-6">
                  <ZMeter1 z={a.z} dim={!isBuy} />
                </div>
                <div className="col-span-1 text-right">
                  <div className="label-xs">PRICE</div>
                  <div className="mono text-sm text-d0">{fc1(a.price, ccy, fx, a.id === "BTC" ? 0 : 2)}</div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="label-xs">52W</div>
                  <div className="mono text-sm" style={{ color: a.chg52w >= 0 ? "var(--buy)" : "var(--sell)" }}>
                    {fpc1(a.chg52w, 1)}
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="label-xs">SIGNAL</div>
                  <div className="mono text-xs" style={{ color: isBuy ? "var(--buy)" : "var(--text-2)" }}>
                    {isBuy ? "▲ BUY" : "— HOLD"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM: 2x2 mini charts */}
      <div className="panel">
        <div className="flex items-center justify-between px-5 py-3 border-b divider">
          <div className="label-xs" style={{ color: "var(--text-0)" }}>5-YEAR PRICE · THUMBNAILS</div>
          <div className="label-xs">200wMA + ±1σ band</div>
        </div>
        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--grid)" }}>
          {window.DATA.ASSETS.map((a) => {
            const snap = window.DATA.SNAP[a.id];
            const isBuy = buySet.has(a.id);
            return (
              <div key={a.id} className="p-4" style={{ background: "var(--bg-panel)" }}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4" style={{ background: AC1[a.id] }}></div>
                    <div className="mono text-sm font-bold text-d0">{a.name}</div>
                    {isBuy && <span className="label-xs" style={{ color: "var(--buy)" }}>· BUY</span>}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="mono text-sm text-d0">{fc1(snap.price, ccy, fx, a.id === "BTC" ? 0 : 2)}</span>
                    <span className="mono text-xs" style={{ color: snap.chg52w >= 0 ? "var(--buy)" : "var(--sell)" }}>
                      {fpc1(snap.chg52w, 1)}
                    </span>
                  </div>
                </div>
                <window.CHARTS.PriceChart assetId={a.id} period="5Y" height={150} showDD={false} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AllocationDonut({ buys, ccy }) {
  const size = 140, R = 56, cx = size / 2, cy = size / 2;
  const stroke = 16;
  const C = 2 * Math.PI * R;
  const nextLabel = ccy === "JPY" ? "¥10,000" : "$100";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={R} stroke="var(--grid)" strokeWidth={stroke} fill="none" />
        <circle cx={cx} cy={cy} r={R} stroke={AC1[buys[0].id]} strokeWidth={stroke} fill="none"
                strokeDasharray={`${C/2 - 2} ${C}`} strokeDashoffset={C/4} transform={`rotate(0 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={R} stroke={AC1[buys[1].id]} strokeWidth={stroke} fill="none"
                strokeDasharray={`${C/2 - 2} ${C}`} strokeDashoffset={-C/4 + 2} transform={`rotate(0 ${cx} ${cy})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="label-xs" style={{ fontSize: 9 }}>NEXT</div>
        <div className="mono text-xl font-bold text-d0">{nextLabel}</div>
        <div className="label-xs mt-1">50 / 50</div>
      </div>
    </div>
  );
}

window.TabRecommend = TabRecommend;

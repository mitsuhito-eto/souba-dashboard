// ===== Tab 3: レジーム =====
const { fmtNum: f3, fmtPct: fpc3, Spark: Spark3, RangeBar: RangeBar3, ASSET_COLOR: AC3, HelpPanel: HP3, SectionHint: SH3, HK: HK3 } = window.ATOMS;

function TabRegime({ ccy }) {
  const macro = window.DATA.MACRO;
  const macroOrder = ["realYield", "yieldCurve", "m2", "vix", "cpi", "unemp"];
  const hyp = window.DATA.BTC_HYPOTHESIS;

  return (
    <div className="tab-pane">
      <HP3 id="regime" title="レジームタブの読み方 — 「いま買って大丈夫な相場環境か」のサニティチェック">
        <p className="mb-2">
          推奨ロジック (Z-score) そのものはマクロ経済を使いません。
          このタブは別軸で<HK3>「今は景気サイクルのどこにいるのか」「インフレ環境はどうか」</HK3>を確認するためのページ。
          推奨と現実の温度感がズレていないかをチェックします。
        </p>
        <p className="mb-2">
          <HK3>■ 上段 マクロ6指標の意味</HK3><br/>
          ・<HK3>Real Yield (米10年実質金利)</HK3> = 名目金利−インフレ期待。<HK3>プラスが大きい</HK3>と現金/債券に有利、株/Goldに不利。<HK3>マイナス</HK3>はその逆<br/>
          ・<HK3>Yield Curve (10Y−2Y)</HK3> = 長短金利差。<HK3 color="var(--sell)">マイナス (逆イールド)</HK3> は景気後退の前兆として有名<br/>
          ・<HK3>M2 YoY</HK3> = マネー供給量の前年比。<HK3 color="var(--buy)">高い</HK3>ほどリスク資産に追い風<br/>
          ・<HK3>VIX</HK3> = 株式市場の恐怖指数。<HK3>20超</HK3>で警戒、<HK3 color="var(--sell)">30超</HK3>でパニック相場<br/>
          ・<HK3>CPI YoY</HK3> = インフレ率 (物価上昇率)。FRBの目標は <HK3>2%</HK3>。これ以上は引き締め継続要因<br/>
          ・<HK3>Unemployment</HK3> = 失業率。<HK3 color="var(--sell)">上昇トレンド</HK3>は景気後退入りのシグナル<br/>
          各カードの <HK3 color="var(--info)">青い縦バー</HK3> = 過去5年レンジの中で「現在値」がどこにいるか。
          スパークラインは過去の推移、緑/赤は前月比。
        </p>
        <p className="mb-2">
          <HK3>■ 中段 ABSOLUTE VALUATION</HK3><br/>
          4資産それぞれを「絶対的に高いか安いか」だけで見るカード。
          <HK3 color="var(--sell)">rich (赤)</HK3> = 過熱、<HK3 color="var(--buy)">cheap (緑)</HK3> = 割安、<HK3>neutral</HK3> = 普通。<br/>
          BTCの <HK3>Mayer Multiple</HK3> = 価格 ÷ 200週MA。
          1.5以上で過熱、0.8以下で割安、というBTC界隈の古典的な指標。
        </p>
        <p>
          <HK3>■ 下段 BTC = DIGITAL GOLD?</HK3><br/>
          BTCがゴールドに似た動きをしているか (=「デジタル・ゴールド」仮説) を90日相関で検証するパネル。<br/>
          <HK3 color="#ffd700">Gold相関</HK3> − <HK3 color="#00d4ff">NASDAQ相関</HK3> ≧ 0.10 →
          <HK3 color="var(--buy)">INTACT</HK3> (Gold寄り、デジタルゴールドとして機能している)<br/>
          逆転 → <HK3 color="var(--warn)">BREAKING</HK3> (テック株寄り、単なるリスク資産として扱うべき)。
          <br/>これが BREAKING に転じたときは、BTCの位置付けを見直すきっかけになります。
        </p>
      </HP3>

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
        <div className="px-5 py-3 border-b divider">
          <div className="flex items-baseline justify-between">
            <div className="label-xs" style={{ color: "var(--text-0)" }}>ABSOLUTE VALUATION · PER ASSET</div>
            <div className="label-xs">2026-04-25</div>
          </div>
          <div className="mt-1.5">
            <SH3>各資産を「絶対的に割高 / 割安か」で見るカード。<span style={{color:"var(--sell)"}}>rich</span>=過熱、<span style={{color:"var(--buy)"}}>cheap</span>=割安、neutral=普通。</SH3>
          </div>
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
        <div className="px-5 py-3 border-b divider">
          <div className="flex items-baseline justify-between">
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
          <div className="mt-1.5">
            <SH3>BTCがGoldとNASDAQのどちらに似た動きをしているか比較。Gold相関 &gt; NASDAQ相関 なら「デジタルゴールド」仮説 INTACT。</SH3>
          </div>
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

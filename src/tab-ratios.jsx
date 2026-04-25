// ===== Tab 4: 比率 =====
const { fmtNum: f4, fmtZ: fz4, ASSET_COLOR: AC4, HelpPanel: HP4, HK: HK4 } = window.ATOMS;

function TabRatios() {
  const [pinned, setPinned] = React.useState([
    { num: "NDX", den: "GLD" },
    { num: "BTC", den: "GLD" },
    { num: "NDX", den: "TLT" },
  ]);
  const [active, setActive] = React.useState({ num: "NDX", den: "GLD" });

  const series = window.DATA.pairSeries(active.num, active.den);
  const last = series[series.length - 1];
  const verdict = last.z <= -1.0 ? "割安" : last.z >= 1.0 ? "割高" : "フェア";
  const verdictColor = verdict === "割安" ? "var(--buy)" : verdict === "割高" ? "var(--sell)" : "var(--text-1)";

  const numAsset = window.DATA.ASSETS.find((a) => a.id === active.num);
  const denAsset = window.DATA.ASSETS.find((a) => a.id === active.den);

  return (
    <div className="tab-pane">
      <HP4 id="ratio" title="比率タブの読み方 — 2資産の「相対的な割安 / 割高」を見る">
        <p className="mb-2">
          1資産を単独で見るのではなく、<HK4>2つの資産の比率 (例: NDX ÷ GLD)</HK4> をチャート化することで、
          「どっちが相対的に割高 / 割安か」を可視化するページです。
          推奨タブの結果と矛盾していないかの確認や、ペアトレードのアイデア出しに使います。
        </p>
        <p className="mb-2">
          <HK4>■ 例: NDX / GLD の読み方</HK4><br/>
          NDX (NASDAQ100) ÷ GLD (Gold ETF) の比率を時系列でプロット。<br/>
          ・比率が長期平均より<HK4 color="var(--sell)">大きく上</HK4> → 株がGoldに対して<HK4 color="var(--sell)">割高</HK4> (=Gold逃避タイミングのサイン)<br/>
          ・比率が長期平均より<HK4 color="var(--buy)">大きく下</HK4> → 株がGoldに対して<HK4 color="var(--buy)">割安</HK4> (=株拾いどき)<br/>
          Z-scoreが <HK4>±1σ</HK4> を超えていれば「歴史的にレアな水準」のサイン。
        </p>
        <p className="mb-2">
          <HK4>■ 上のボタン</HK4><br/>
          <HK4>PINNED PAIRS</HK4> = よく見るペアのショートカット。
          <HK4>CUSTOM</HK4> プルダウンで分子 / 分母を自由に選び、12通りのペアを切替可能。
        </p>
        <p>
          <HK4>■ 右の PAIR Z-SCORE MATRIX</HK4><br/>
          全ペアの現在のZ-scoreを一覧表示するヒートマップ。<br/>
          行 = 分子、列 = 分母。<HK4 color="var(--buy)">緑が濃い</HK4>ほど「行資産が列資産に対して割安」、
          <HK4 color="var(--sell)">赤が濃い</HK4>ほど割高。<br/>
          セルをクリックでメインチャートが切り替わります。極端な色のセルが「いま面白いペア」。
        </p>
      </HP4>

      {/* Top controls */}
      <div className="panel mb-4 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="label-xs">PINNED PAIRS</div>
          {pinned.map((p, i) => {
            const isActive = active.num === p.num && active.den === p.den;
            return (
              <button key={i} onClick={() => setActive(p)}
                      className="flex items-center gap-2 px-3 py-1.5 border"
                      style={{
                        borderColor: isActive ? "rgba(0,212,255,0.6)" : "var(--grid)",
                        background: isActive ? "rgba(0,212,255,0.08)" : "transparent",
                      }}>
                <span style={{ display: "inline-block", width: 6, height: 6, background: AC4[p.num] }}></span>
                <span className="mono" style={{ fontSize: 11, color: isActive ? "var(--info)" : "var(--text-1)" }}>
                  {p.num} / {p.den}
                </span>
                <span style={{ display: "inline-block", width: 6, height: 6, background: AC4[p.den] }}></span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="label-xs">CUSTOM</div>
          <select className="fs" value={active.num} onChange={(e) => setActive({ ...active, num: e.target.value })}>
            {window.DATA.ASSETS.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
          </select>
          <span className="mono text-d2">/</span>
          <select className="fs" value={active.den} onChange={(e) => setActive({ ...active, den: e.target.value })}>
            {window.DATA.ASSETS.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main ratio chart */}
        <div className="col-span-8 panel">
          <div className="px-5 py-3 border-b divider flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <div className="mono text-base font-bold" style={{ color: AC4[active.num] }}>{numAsset.name}</div>
              <span className="mono text-d2">/</span>
              <div className="mono text-base font-bold" style={{ color: AC4[active.den] }}>{denAsset.name}</div>
              <div className="label-xs ml-2">RATIO · 10Y</div>
            </div>
            <div className="flex items-baseline gap-6">
              <div className="text-right">
                <div className="label-xs">RATIO</div>
                <div className="mono text-base text-d0">{f4(last.r, last.r < 1 ? 4 : 2)}</div>
              </div>
              <div className="text-right">
                <div className="label-xs">MEAN</div>
                <div className="mono text-base text-d1">{f4(last.mean, last.mean < 1 ? 4 : 2)}</div>
              </div>
              <div className="text-right">
                <div className="label-xs">Z-SCORE</div>
                <div className="mono text-2xl font-bold" style={{ color: verdictColor }}>{fz4(last.z)}</div>
              </div>
            </div>
          </div>
          <div className="p-3">
            <window.CHARTS.RatioChart data={series} color={AC4[active.num]} height={340} />
          </div>
          <div className="px-5 py-3 border-t divider mono text-sm leading-relaxed text-d0">
            現在 <span className="font-bold" style={{ color: AC4[active.num] }}>{numAsset.name}</span> は
            <span className="font-bold" style={{ color: AC4[active.den] }}> {denAsset.name}</span> に対して
            <span className="font-bold ml-1" style={{ color: verdictColor }}>[{verdict}]</span>
            <span className="text-d2 mono text-xs ml-3">· z = {fz4(last.z)} · 平均からの乖離 {f4((last.r / last.mean - 1) * 100, 1)}%</span>
          </div>
        </div>

        {/* Heatmap */}
        <div className="col-span-4 panel">
          <div className="px-5 py-3 border-b divider flex items-baseline justify-between">
            <div className="label-xs" style={{ color: "var(--text-0)" }}>PAIR Z-SCORE MATRIX</div>
            <div className="label-xs">緑=割安 · 赤=割高</div>
          </div>
          <div className="p-4">
            <Heatmap setActive={setActive} active={active} />
            <div className="mt-4 flex items-center justify-between">
              <div className="label-xs">SCALE</div>
              <div className="flex items-center gap-2 mono" style={{ fontSize: 10 }}>
                <span style={{ color: "var(--buy)" }}>−2σ</span>
                <div style={{
                  width: 80, height: 6,
                  background: "linear-gradient(to right, #00ff88, #2a3140 50%, #ff3366)",
                }}></div>
                <span style={{ color: "var(--sell)" }}>+2σ</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t divider">
              <div className="label-xs mb-2">READ</div>
              <div className="mono text-xs text-d1 leading-relaxed">
                行 = 分子, 列 = 分母。<br/>
                セル <span className="text-buy">緑</span> = 行資産が列資産に対し割安。<br/>
                クリックでメイン切替。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Heatmap({ setActive, active }) {
  const ASSETS = window.DATA.ASSETS;
  const HM = window.DATA.HEATMAP;
  function cellColor(z) {
    if (z == null) return "var(--bg-panel-hi)";
    const c = Math.max(-2, Math.min(2, z)) / 2; // -1..+1
    if (c < 0) {
      const a = Math.abs(c);
      return `rgba(0, 255, 136, ${0.10 + a * 0.55})`;
    } else {
      return `rgba(255, 51, 102, ${0.10 + c * 0.55})`;
    }
  }
  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: "auto repeat(4, 1fr)", gap: 1 }}>
        <div></div>
        {ASSETS.map((a) => (
          <div key={a.id} className="label-xs text-center pb-1" style={{ color: AC4[a.id], fontSize: 10 }}>{a.id}</div>
        ))}
        {HM.map((row, i) => (
          <React.Fragment key={i}>
            <div className="label-xs pr-2 flex items-center justify-end" style={{ color: AC4[ASSETS[i].id], fontSize: 10 }}>
              {ASSETS[i].id}
            </div>
            {row.map((cell, j) => {
              const isSelf = cell.z == null;
              const isActiveCell = active.num === cell.num && active.den === cell.den;
              return (
                <button key={j}
                        onClick={() => !isSelf && setActive({ num: cell.num, den: cell.den })}
                        className={isSelf ? "" : "hcell"}
                        disabled={isSelf}
                        style={{
                          background: cellColor(cell.z),
                          color: isSelf ? "var(--text-3)" : "var(--text-0)",
                          padding: "12px 0",
                          fontFamily: "JetBrains Mono",
                          fontSize: 12,
                          fontWeight: 600,
                          outline: isActiveCell ? "1px solid var(--info)" : "none",
                          outlineOffset: -1,
                        }}>
                  {isSelf ? "—" : (cell.z >= 0 ? "+" : "") + cell.z.toFixed(2)}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

window.TabRatios = TabRatios;

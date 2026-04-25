// ===== Shared atoms =====
const { useState, useEffect, useMemo, useRef } = React;

// Number formatting
function fmtNum(v, dp = 2) {
  if (v == null || isNaN(v)) return "—";
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  const fixed = a.toFixed(dp);
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + withCommas + (dec ? "." + dec : "");
}
function fmtPrice(v, ccy = "USD") {
  if (v >= 1000) return fmtNum(v, 0);
  if (v >= 100) return fmtNum(v, 1);
  return fmtNum(v, 2);
}
function fmtPct(v, dp = 2, sign = true) {
  if (v == null || isNaN(v)) return "—";
  const s = (sign && v >= 0 ? "+" : "") + fmtNum(v, dp) + "%";
  return s;
}
function fmtZ(z) {
  return (z >= 0 ? "+" : "") + fmtNum(z, 2) + "σ";
}
function fmtCcy(usdPrice, ccy, fx, dpUsd = 2) {
  if (usdPrice == null || isNaN(usdPrice)) return "—";
  if (ccy === "JPY") {
    const jpy = usdPrice * (fx || 1);
    return "¥" + fmtNum(jpy, jpy >= 1000 ? 0 : 1);
  }
  return "$" + fmtNum(usdPrice, dpUsd);
}

// Color helpers
function zColor(z) {
  if (z <= -1.5) return "var(--buy)";
  if (z <= -0.5) return "rgba(0, 255, 136, 0.65)";
  if (z >= 1.5) return "var(--sell)";
  if (z >= 0.5) return "rgba(255, 51, 102, 0.65)";
  return "var(--text-1)";
}
function deltaColor(v) {
  if (v == null) return "var(--text-1)";
  if (v > 0) return "var(--buy)";
  if (v < 0) return "var(--sell)";
  return "var(--text-1)";
}

// Sparkline
function Spark({ data, color = "var(--text-1)", width = 80, height = 20, fill = false }) {
  if (!data || data.length === 0) return null;
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => (typeof d === "number" ? d : d.v ?? d.p ?? d.c ?? 0));
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const sx = (i) => (i / (xs.length - 1)) * width;
  const sy = (v) => height - ((v - min) / span) * height;
  const d = ys.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ");
  const fillD = fill ? `${d} L${width} ${height} L0 ${height} Z` : null;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={fillD} fill={color} opacity="0.15" stroke="none" />}
      <path d={d} stroke={color} />
    </svg>
  );
}

// Z-Score meter: -3..+3 horizontal bar with marker
function ZMeter({ z, dim = false, height = 8 }) {
  const clamped = Math.max(-3, Math.min(3, z));
  const pct = ((clamped + 3) / 6) * 100;
  const isBuy = z <= -0.5;
  const isSell = z >= 0.5;
  const color = isBuy ? "var(--buy)" : isSell ? "var(--sell)" : "var(--text-1)";
  const op = dim ? 0.35 : 1;
  return (
    <div className="relative w-full" style={{ height: height + 12 }}>
      <div className="zmeter-track relative w-full" style={{ height, opacity: dim ? 0.55 : 1 }}>
        {/* center line */}
        <div className="absolute top-0 bottom-0" style={{ left: "50%", width: 1, background: "var(--grid-hi)" }} />
        {/* ±1σ ticks */}
        {[-2, -1, 1, 2].map((n) => (
          <div key={n} className="absolute" style={{
            left: `${((n + 3) / 6) * 100}%`, top: 0, bottom: 0, width: 1,
            background: "var(--grid)"
          }} />
        ))}
        {/* highlight buy zone for buy assets */}
        {!dim && isBuy && (
          <div className="absolute top-0 bottom-0" style={{
            left: `${pct}%`,
            right: 0,
            background: "linear-gradient(to right, rgba(0,255,136,0.20), rgba(0,255,136,0.02))",
          }} />
        )}
        {/* marker */}
        <div className="absolute" style={{
          left: `calc(${pct}% - 1px)`,
          top: -2, bottom: -2,
          width: 2,
          background: color,
          opacity: op,
          boxShadow: !dim && (isBuy || isSell) ? `0 0 6px ${color}` : "none",
        }} />
      </div>
      {/* axis labels */}
      <div className="flex justify-between label-xs mt-1" style={{ fontSize: 9 }}>
        <span>-3σ</span>
        <span>-2σ</span>
        <span>-1σ</span>
        <span style={{ color: "var(--text-1)" }}>0</span>
        <span>+1σ</span>
        <span>+2σ</span>
        <span>+3σ</span>
      </div>
    </div>
  );
}

// Range bar: shows current vs 5y range
function RangeBar({ value, min, max, height = 4 }) {
  const span = max - min || 1;
  const pct = Math.max(0, Math.min(1, (value - min) / span)) * 100;
  return (
    <div className="relative w-full" style={{ height, background: "var(--grid)" }}>
      <div className="absolute top-0 bottom-0" style={{
        left: `calc(${pct}% - 1px)`, width: 2, background: "var(--info)",
      }} />
      <div className="flex justify-between label-xs absolute -bottom-3.5 left-0 right-0" style={{ fontSize: 9 }}>
      </div>
    </div>
  );
}

// Assigned colors for assets (for visualisation)
const ASSET_COLOR = {
  NDX: "#00d4ff",
  GLD: "#ffd700",
  BTC: "#ff9933",
  TLT: "#9b8cff",
};

// Collapsible help panel — Japanese explanation for each tab/section
function HelpPanel({ id, title = "このタブの読み方", children, defaultOpen = true }) {
  const key = `souba-help-${id}`;
  const [open, setOpen] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return defaultOpen;
      return v === "1";
    } catch { return defaultOpen; }
  });
  const toggle = () => setOpen((o) => {
    const n = !o;
    try { localStorage.setItem(key, n ? "1" : "0"); } catch {}
    return n;
  });
  return (
    <div className="panel mb-4" style={{ borderColor: "rgba(0, 212, 255, 0.25)" }}>
      <button onClick={toggle}
              className="w-full flex items-center justify-between px-5 py-2.5"
              style={{ background: open ? "rgba(0, 212, 255, 0.04)" : "transparent" }}>
        <div className="flex items-center gap-3">
          <span className="label-xs" style={{ color: "var(--info)" }}>HELP</span>
          <span style={{
            fontFamily: "Noto Sans JP, system-ui",
            fontSize: 12,
            color: "var(--text-1)",
            letterSpacing: "0.02em",
          }}>{title}</span>
        </div>
        <span className="mono" style={{ color: "var(--text-2)", fontSize: 11 }}>{open ? "▾ 閉じる" : "▸ 開く"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3"
             style={{
               fontFamily: "Noto Sans JP, system-ui",
               fontSize: 12.5,
               lineHeight: 1.85,
               color: "var(--text-1)",
               borderTop: "1px solid var(--grid)",
             }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Short inline hint shown under section headers — single sentence in Japanese
function SectionHint({ children }) {
  return (
    <div style={{
      fontFamily: "Noto Sans JP, system-ui",
      fontSize: 11,
      color: "var(--text-2)",
      letterSpacing: "0.02em",
      lineHeight: 1.5,
    }}>{children}</div>
  );
}

// Re-usable highlight span for keywords in help text
function HK({ children, color = "var(--text-0)" }) {
  return <span style={{ color, fontWeight: 600 }}>{children}</span>;
}

window.ATOMS = { fmtNum, fmtPrice, fmtPct, fmtZ, fmtCcy, zColor, deltaColor, Spark, ZMeter, RangeBar, ASSET_COLOR, HelpPanel, SectionHint, HK };

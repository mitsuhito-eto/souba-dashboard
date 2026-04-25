// ===== Recharts wrappers =====
const {
  LineChart, Line, Area, AreaChart, ComposedChart, ReferenceLine, ReferenceArea,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart,
} = Recharts;

const GRID = "#1a1f2e";
const TXT2 = "#5b6479";

function ChartTooltip({ active, payload, label, formatter, suffix }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tip">
      <div style={{ color: "var(--text-2)" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.stroke || "var(--text-0)" }}>
          {p.name}: {formatter ? formatter(p.value) : window.ATOMS.fmtNum(p.value, 2)}{suffix || ""}
        </div>
      ))}
    </div>
  );
}

// Long chart with 200wMA + ±1σ/±2σ bands + drawdown
function PriceChart({ assetId, period = "5Y", logScale = false, real = false, height = 240, showDD = true }) {
  const series = window.DATA.SERIES[assetId];
  // Period filter
  const periodWeeks = { "3M": 13, "6M": 26, "1Y": 52, "3Y": 156, "5Y": 260, "10Y": 520, "All": series.length };
  const w = periodWeeks[period] || 260;
  const sub = series.slice(-w);
  const color = window.ATOMS.ASSET_COLOR[assetId];

  // For log scale we transform values; recharts supports scale="log" but we handle via Y domain
  const ddData = sub.map((d) => ({ t: d.t, dd: d.dd }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={sub} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" tick={{ fill: TXT2, fontSize: 10, fontFamily: "JetBrains Mono" }}
                 axisLine={{ stroke: GRID }} tickLine={false}
                 tickFormatter={(t) => t.slice(0, 7)}
                 minTickGap={50}
          />
          <YAxis
            tick={{ fill: TXT2, fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false} tickLine={false}
            scale={logScale ? "log" : "auto"}
            domain={logScale ? ["auto", "auto"] : ["auto", "auto"]}
            width={56}
            tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(1) + "k" : window.ATOMS.fmtNum(v, 0)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: TXT2, strokeDasharray: "2 2" }} />
          {/* ±2σ band */}
          <Area type="monotone" dataKey="upper2" stroke="none" fill={color} fillOpacity={0.04} name="+2σ" />
          <Area type="monotone" dataKey="lower2" stroke="none" fill="var(--bg-panel)" fillOpacity={1} name="" />
          {/* ±1σ band */}
          <Area type="monotone" dataKey="upper1" stroke="none" fill={color} fillOpacity={0.06} name="+1σ" />
          <Area type="monotone" dataKey="lower1" stroke="none" fill="var(--bg-panel)" fillOpacity={1} name="" />
          {/* MA dashed */}
          <Line type="monotone" dataKey="ma" stroke="#9aa3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} name="200wMA" />
          {/* Price */}
          <Line type="monotone" dataKey="p" stroke={color} strokeWidth={1.5} dot={false} name="Price" />
        </ComposedChart>
      </ResponsiveContainer>
      {showDD && (
        <ResponsiveContainer width="100%" height={64}>
          <AreaChart data={ddData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="t" tick={false} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis
              tick={{ fill: TXT2, fontSize: 9, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false}
              width={56}
              tickFormatter={(v) => v.toFixed(0) + "%"}
              domain={[(min) => Math.floor(min / 10) * 10, 0]}
            />
            <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: TXT2, strokeDasharray: "2 2" }} />
            <Area type="monotone" dataKey="dd" stroke="#ff3366" strokeWidth={1} fill="#ff3366" fillOpacity={0.18} name="Drawdown" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Tiny chart for tab1 / hover thumbnails
function MiniChart({ assetId, period = "5Y", height = 90 }) {
  const series = window.DATA.SERIES[assetId];
  const periodWeeks = { "1Y": 52, "3Y": 156, "5Y": 260, "10Y": 520, "All": series.length };
  const w = periodWeeks[period] || 260;
  const sub = series.slice(-w);
  const color = window.ATOMS.ASSET_COLOR[assetId];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={sub} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${assetId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="p" stroke={color} strokeWidth={1.25} fill={`url(#g-${assetId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Correlation chart for tab3 hypothesis
function CorrChart({ data, color, label, height = 140 }) {
  const filtered = data.filter((d) => d.c != null).slice(-200);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={filtered} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="t" tick={{ fill: TXT2, fontSize: 10, fontFamily: "JetBrains Mono" }}
               axisLine={{ stroke: GRID }} tickLine={false}
               tickFormatter={(t) => t.slice(0, 7)} minTickGap={60} />
        <YAxis tick={{ fill: TXT2, fontSize: 10, fontFamily: "JetBrains Mono" }}
               axisLine={false} tickLine={false} width={40}
               domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tickFormatter={(v) => v.toFixed(1)} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={0} stroke={GRID} />
        <Line type="monotone" dataKey="c" stroke={color} strokeWidth={1.25} dot={false} name={label} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Ratio chart for tab4
function RatioChart({ data, color, height = 320 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="t" tick={{ fill: TXT2, fontSize: 10, fontFamily: "JetBrains Mono" }}
               axisLine={{ stroke: GRID }} tickLine={false}
               tickFormatter={(t) => t.slice(0, 7)} minTickGap={60} />
        <YAxis tick={{ fill: TXT2, fontSize: 10, fontFamily: "JetBrains Mono" }}
               axisLine={false} tickLine={false} width={56}
               tickFormatter={(v) => v < 0.01 ? v.toExponential(1) : window.ATOMS.fmtNum(v, v < 1 ? 4 : 2)} />
        <Tooltip content={<ChartTooltip formatter={(v) => window.ATOMS.fmtNum(v, 4)} />} />
        <Area type="monotone" dataKey="upper2" stroke="none" fill={color} fillOpacity={0.04} name="+2σ" />
        <Area type="monotone" dataKey="lower2" stroke="none" fill="var(--bg-panel)" fillOpacity={1} name="" />
        <Area type="monotone" dataKey="upper1" stroke="none" fill={color} fillOpacity={0.06} name="+1σ" />
        <Area type="monotone" dataKey="lower1" stroke="none" fill="var(--bg-panel)" fillOpacity={1} name="" />
        <Line type="monotone" dataKey="mean" stroke="#9aa3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Mean" />
        <Line type="monotone" dataKey="r" stroke={color} strokeWidth={1.5} dot={false} name="Ratio" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

window.CHARTS = { PriceChart, MiniChart, CorrChart, RatioChart };

import { useState, useEffect, useRef } from "react";


// ─── Coin Ticker Data ───
const TICKER_DATA = [
  { sym: "BTC", name: "Bitcoin", price: 84231.45, change: 2.34 },
  { sym: "ETH", name: "Ethereum", price: 3891.12, change: -0.87 },
  { sym: "SOL", name: "Solana", price: 187.34, change: 5.12 },
  { sym: "LINK", name: "Chainlink", price: 22.78, change: 1.45 },
  { sym: "AVAX", name: "Avalanche", price: 41.23, change: -2.11 },
  { sym: "DOT", name: "Polkadot", price: 8.92, change: 0.34 },
  { sym: "MATIC", name: "Polygon", price: 1.23, change: 3.67 },
  { sym: "ADA", name: "Cardano", price: 0.72, change: -1.23 },
  { sym: "XRP", name: "Ripple", price: 2.41, change: 0.89 },
  { sym: "DOGE", name: "Dogecoin", price: 0.187, change: -0.45 },
  { sym: "UNI", name: "Uniswap", price: 14.56, change: 2.78 },
  { sym: "AAVE", name: "Aave", price: 267.89, change: 1.02 },
  { sym: "ARB", name: "Arbitrum", price: 1.87, change: -0.67 },
  { sym: "OP", name: "Optimism", price: 3.45, change: 4.21 },
  { sym: "SUI", name: "Sui", price: 4.12, change: 6.34 },
];

// ─── Marketplace Bot Data ───
const MARKETPLACE_BOTS = [
  { id: 1, name: "Sentinel Alpha", dev: "QuantLabs", desc: "News-sentiment reactive bot with sub-second execution. Trained on 4 years of market data.", rating: 4.9, reviews: 1247, price: 29, pnl: "+34.2%", period: "90d", tags: ["Sentiment", "News"], risk: "Medium", coins: ["BTC", "ETH", "SOL"], subscribers: 3420, badge: "TOP RATED" },
  { id: 2, name: "Grid Phantom", dev: "CryptoForge", desc: "Advanced grid strategy with dynamic range adjustment. Optimized for sideways markets.", rating: 4.7, reviews: 892, price: 19, pnl: "+21.7%", period: "90d", tags: ["Grid", "DCA"], risk: "Low", coins: ["BTC", "ETH"], subscribers: 2180, badge: "POPULAR" },
  { id: 3, name: "Whale Tracker Pro", dev: "DeepChain", desc: "Monitors whale wallet movements and front-runs large market orders with precision.", rating: 4.8, reviews: 634, price: 49, pnl: "+52.1%", period: "90d", tags: ["On-chain", "Whale"], risk: "High", coins: ["BTC", "ETH", "SOL", "LINK"], subscribers: 1890, badge: "HIGH YIELD" },
  { id: 4, name: "Momentum Drift", dev: "AlgoSmith", desc: "Rides momentum waves using RSI divergence and volume profile analysis.", rating: 4.6, reviews: 1102, price: 24, pnl: "+28.4%", period: "90d", tags: ["Technical", "Momentum"], risk: "Medium", coins: ["SOL", "AVAX", "ARB"], subscribers: 2750, badge: null },
  { id: 5, name: "Neural Scalper", dev: "Nexus AI", desc: "ML-powered scalping engine. 200+ trades/day with tight risk controls.", rating: 4.5, reviews: 567, price: 39, pnl: "+18.9%", period: "90d", tags: ["AI/ML", "Scalp"], risk: "High", coins: ["BTC", "ETH"], subscribers: 980, badge: null },
  { id: 6, name: "SafeHaven DCA", dev: "SteadyStack", desc: "Conservative dollar-cost averaging with smart entry optimization.", rating: 4.8, reviews: 2341, price: 9, pnl: "+15.3%", period: "90d", tags: ["DCA", "Conservative"], risk: "Low", coins: ["BTC", "ETH", "SOL", "ADA", "DOT"], subscribers: 5670, badge: "BEST VALUE" },
];

// ─── Portfolio / Dashboard Data ───
const PORTFOLIO_COINS = [
  { sym: "BTC", name: "Bitcoin", holdings: 0.4521, value: 38080.12, allocation: 42, bot: "Sentinel Alpha", botStatus: "active", pnl: "+12.4%", pnlVal: 4213.50 },
  { sym: "ETH", name: "Ethereum", holdings: 8.234, value: 32043.89, allocation: 35, bot: "Grid Phantom", botStatus: "active", pnl: "+8.7%", pnlVal: 2567.23 },
  { sym: "SOL", name: "Solana", holdings: 42.5, value: 7961.95, allocation: 15, bot: null, botStatus: "none", pnl: "+22.1%", pnlVal: 1438.90 },
  { sym: "LINK", name: "Chainlink", holdings: 156.3, value: 3560.51, allocation: 5, bot: "Whale Tracker Pro", botStatus: "paused", pnl: "-3.2%", pnlVal: -117.45 },
  { sym: "ARB", name: "Arbitrum", holdings: 1420, value: 2655.40, allocation: 3, bot: null, botStatus: "none", pnl: "+5.6%", pnlVal: 140.82 },
];

const CHART_DATA = [42, 44, 41, 46, 48, 45, 50, 52, 49, 54, 57, 55, 59, 62, 58, 63, 67, 65, 69, 72, 70, 74, 78, 76, 80, 83, 81, 85, 84, 87];

// ─── Icons ───
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  marketplace: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5z"/><line x1="3" y1="7" x2="21" y2="7"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  connect: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  star: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  play: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  plug: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6m-3-3h6m-9 7a6 6 0 0012 0V9H6v3z"/><path d="M12 18v4"/></svg>,
  chevDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  arrowUp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  arrowDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  zap: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  exchange: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
};

// ─── Mini Sparkline ───
function Sparkline({ data, color, width = 80, height = 28 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Portfolio Mini Chart ───
function PortfolioChart() {
  const w = 460, h = 140, pad = 0;
  const data = CHART_DATA;
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (w - pad * 2), h - pad - ((v - min) / range) * (h - pad * 2)]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#10B981" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="#10B981" fillOpacity="0.2" />
    </svg>
  );
}

// ─── Ticker Strip ───
function TickerStrip() {
  const doubled = [...TICKER_DATA, ...TICKER_DATA];
  return (
    <div style={{ background: "#0B0F14", borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", whiteSpace: "nowrap", height: 36, display: "flex", alignItems: "center" }}>
      <div style={{ display: "inline-flex", gap: 0, animation: "tickerScroll 40s linear infinite" }}>
        {doubled.map((c, i) => (
          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 20px", borderRight: "1px solid rgba(255,255,255,0.06)", height: 36 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "#fff", letterSpacing: 0.5 }}>{c.sym}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>${c.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: c.change >= 0 ? "#34D399" : "#F87171", display: "flex", alignItems: "center", gap: 2 }}>
              {c.change >= 0 ? "▲" : "▼"} {Math.abs(c.change)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───
export default function CryptiqApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [marketFilter, setMarketFilter] = useState("all");
  const [assignModal, setAssignModal] = useState(null);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "marketplace", label: "Marketplace", icon: Icons.marketplace },
    { id: "connections", label: "Connections", icon: Icons.connect },
    { id: "settings", label: "Settings", icon: Icons.settings },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F6F7F9", color: "#0A0F1C", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.3); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; transition: all 0.2s ease; }
        .card:hover { border-color: #D1D5DB; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
        .btn-primary { background: #10B981; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .btn-secondary { background: #F3F4F6; color: #374151; border: 1px solid #E5E7EB; padding: 8px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 6px; }
        .btn-secondary:hover { background: #E5E7EB; }
        .tag { display: inline-flex; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
        .badge-top { background: linear-gradient(135deg, #10B981, #059669); color: #fff; }
        .badge-popular { background: linear-gradient(135deg, #3B82F6, #2563EB); color: #fff; }
        .badge-yield { background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; }
        .badge-value { background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: #fff; }
        .status-active { background: #D1FAE5; color: #065F46; }
        .status-paused { background: #FEF3C7; color: #92400E; }
        .status-none { background: #F3F4F6; color: #6B7280; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease; font-size: 13.5px; font-weight: 500; color: #6B7280; border: none; background: none; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; }
        .nav-item:hover { background: #F3F4F6; color: #374151; }
        .nav-item.active { background: #ECFDF5; color: #065F46; font-weight: 600; }
        .filter-chip { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #E5E7EB; background: #fff; color: #6B7280; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif; }
        .filter-chip:hover { border-color: #10B981; color: #10B981; }
        .filter-chip.active { background: #ECFDF5; border-color: #10B981; color: #065F46; font-weight: 600; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; animation: fadeIn 0.15s ease; }
        .modal { background: #fff; border-radius: 16px; padding: 28px; width: 440px; max-width: 90vw; box-shadow: 0 24px 48px rgba(0,0,0,0.15); animation: fadeIn 0.2s ease; }
        input[type="text"], input[type="email"], input[type="password"], select { width: 100%; padding: 10px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0A0F1C; background: #FAFBFC; transition: all 0.15s ease; outline: none; }
        input:focus, select:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .toggle { width: 40px; height: 22px; border-radius: 11px; background: #D1D5DB; position: relative; cursor: pointer; transition: background 0.2s ease; }
        .toggle.on { background: #10B981; }
        .toggle::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 2px; left: 2px; transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .toggle.on::after { transform: translateX(18px); }
      `}</style>

      {/* Ticker */}
      <TickerStrip />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: 240, background: "#fff", borderRight: "1px solid #E5E7EB", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "4px 16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16 }}>C</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 18, color: "#0A0F1C", letterSpacing: -0.5, lineHeight: 1 }}>Cryptiq</div>
              <div style={{ fontSize: 9.5, fontWeight: 500, color: "#10B981", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Neural Engine</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} className={`nav-item ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Portfolio Summary */}
          <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Total Portfolio</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700, color: "#0A0F1C" }}>$84,301.87</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>{Icons.arrowUp} +$8,243.00</span>
              <span style={{ color: "#10B981", fontSize: 11, fontWeight: 500 }}>(+10.8%)</span>
            </div>
          </div>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 8px 4px", borderTop: "1px solid #E5E7EB", marginTop: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>{Icons.user}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0A0F1C" }}>Alex Chen</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Pro Account</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "24px 28px", maxHeight: "calc(100vh - 36px)" }}>
          {activeTab === "dashboard" && <DashboardView onAssign={(sym) => setAssignModal(sym)} />}
          {activeTab === "marketplace" && <MarketplaceView filter={marketFilter} setFilter={setMarketFilter} />}
          {activeTab === "connections" && <ConnectionsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Assign Bot Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Assign Bot to {assignModal}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Select an algorithm from your subscriptions or the marketplace.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MARKETPLACE_BOTS.slice(0, 4).map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.background = "#F0FDF4"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "transparent"; }}
                  onClick={() => setAssignModal(null)}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>by {b.dev} · {b.pnl} ({b.period})</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#10B981", fontSize: 12, fontWeight: 600 }}>{Icons.zap} Assign</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => setAssignModal(null)}>Browse Marketplace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard View ───
function DashboardView({ onAssign }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Good morning, Alex</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>3 bots active · 2 coins unassigned · Portfolio up 10.8% this month</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary">{Icons.bell} Alerts</button>
          <button className="btn-primary">{Icons.zap} Quick Trade</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Portfolio Value", value: "$84,301.87", change: "+10.8%", up: true },
          { label: "Active Bots", value: "3 / 5", change: "2 slots free", up: null },
          { label: "30d P&L", value: "+$8,243.00", change: "+10.8%", up: true },
          { label: "Win Rate", value: "67.3%", change: "+2.1% vs last month", up: true },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            {s.change && (
              <div style={{ fontSize: 12, fontWeight: 500, color: s.up === null ? "#6B7280" : s.up ? "#10B981" : "#EF4444", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                {s.up !== null && (s.up ? Icons.arrowUp : Icons.arrowDown)} {s.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Active Bots Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 20 }}>
        {/* Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Portfolio Performance</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>Last 30 days</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["7D", "30D", "90D", "1Y"].map((p, i) => (
                <button key={p} className={`filter-chip ${i === 1 ? "active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }}>{p}</button>
              ))}
            </div>
          </div>
          <PortfolioChart />
        </div>

        {/* Active Bots */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Active Algorithms</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PORTFOLIO_COINS.filter(c => c.bot).map(c => (
              <div key={c.sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {c.bot}
                    <span className={`tag status-${c.botStatus}`} style={{ fontSize: 9, padding: "2px 6px" }}>{c.botStatus}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Assigned to {c.sym}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: c.botStatus === "active" ? "#10B981" : "#F59E0B" }}>
                    {c.botStatus === "active" ? Icons.pause : Icons.play}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Holdings & Bot Assignments</div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>{Icons.search} Filter</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
              {["Asset", "Holdings", "Value", "Allocation", "P&L", "Assigned Bot", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PORTFOLIO_COINS.map(c => (
              <tr key={c.sym} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#374151" }}>{c.sym.slice(0, 2)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.sym}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{c.holdings}</td>
                <td style={{ padding: "14px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500 }}>${c.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: "#E5E7EB", overflow: "hidden" }}>
                      <div style={{ width: `${c.allocation}%`, height: "100%", borderRadius: 3, background: "#10B981" }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B7280" }}>{c.allocation}%</span>
                  </div>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: c.pnlVal >= 0 ? "#10B981" : "#EF4444" }}>{c.pnl}</span>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  {c.bot ? (
                    <span className={`tag status-${c.botStatus}`} style={{ fontSize: 11, padding: "4px 10px" }}>{c.bot}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#D1D5DB" }}>No bot assigned</span>
                  )}
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <button className={c.bot ? "btn-secondary" : "btn-primary"} style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => !c.bot && onAssign(c.sym)}>
                    {c.bot ? "Manage" : <>{Icons.plug} Assign</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Marketplace View ───
function MarketplaceView({ filter, setFilter }) {
  const filters = [
    { id: "all", label: "All Bots" },
    { id: "sentiment", label: "Sentiment" },
    { id: "technical", label: "Technical" },
    { id: "onchain", label: "On-chain" },
    { id: "dca", label: "DCA" },
    { id: "ai", label: "AI / ML" },
  ];

  const filtered = filter === "all" ? MARKETPLACE_BOTS : MARKETPLACE_BOTS.filter(b =>
    b.tags.some(t => t.toLowerCase().includes(filter.replace("ai", "ai/ml").replace("onchain", "on-chain")))
  );

  const getBadgeClass = (badge) => {
    if (!badge) return "";
    if (badge === "TOP RATED") return "badge-top";
    if (badge === "POPULAR") return "badge-popular";
    if (badge === "HIGH YIELD") return "badge-yield";
    if (badge === "BEST VALUE") return "badge-value";
    return "";
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Algorithm Marketplace</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>Discover, subscribe, and deploy trading algorithms built by top developers</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <input type="text" placeholder="Search algorithms..." style={{ paddingLeft: 36, width: 240 }} />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>{Icons.search}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f.id} className={`filter-chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {/* Bot Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
        {filtered.map(b => (
          <div key={b.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700 }}>{b.name}</span>
                  {b.badge && <span className={`tag ${getBadgeClass(b.badge)}`} style={{ fontSize: 9, letterSpacing: 0.5 }}>{b.badge}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>by {b.dev} · {b.subscribers.toLocaleString()} subscribers</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: "#0A0F1C" }}>${b.price}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>/month</div>
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, marginBottom: 14, flex: 1 }}>{b.desc}</div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 0", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Return ({b.period})</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "#10B981", marginTop: 2 }}>{b.pnl}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ color: "#F59E0B" }}>{Icons.star}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{b.rating}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>({b.reviews})</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Risk Level</div>
                <span className="tag" style={{
                  marginTop: 4,
                  background: b.risk === "Low" ? "#D1FAE5" : b.risk === "Medium" ? "#FEF3C7" : "#FEE2E2",
                  color: b.risk === "Low" ? "#065F46" : b.risk === "Medium" ? "#92400E" : "#991B1B",
                  fontSize: 11
                }}>{b.risk}</span>
              </div>
            </div>

            {/* Tags + Coins */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {b.tags.map(t => <span key={t} className="tag" style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 10 }}>{t}</span>)}
              </div>
              <div style={{ display: "flex", gap: -4 }}>
                {b.coins.slice(0, 3).map((coin, ci) => (
                  <div key={coin} style={{ width: 24, height: 24, borderRadius: 6, background: "#F3F4F6", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#6B7280", marginLeft: ci > 0 ? -6 : 0, zIndex: 3 - ci }}>{coin.slice(0, 2)}</div>
                ))}
                {b.coins.length > 3 && <div style={{ width: 24, height: 24, borderRadius: 6, background: "#E5E7EB", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "#6B7280", marginLeft: -6 }}>+{b.coins.length - 3}</div>}
              </div>
            </div>

            {/* CTA */}
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px 0" }}>
              {Icons.zap} Subscribe & Deploy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Connections View ───
function ConnectionsView() {
  const exchanges = [
    { name: "Binance", status: "connected", icon: "B", color: "#F0B90B", pairs: 12, volume: "$42,150" },
    { name: "Coinbase", status: "connected", icon: "C", color: "#0052FF", pairs: 8, volume: "$18,340" },
    { name: "Kraken", status: "disconnected", icon: "K", color: "#5741D9", pairs: 0, volume: "$0" },
    { name: "Bybit", status: "disconnected", icon: "By", color: "#F7A600", pairs: 0, volume: "$0" },
  ];

  const wallets = [
    { name: "MetaMask", address: "0x7a3d...8f2e", chains: ["Ethereum", "Polygon", "Arbitrum"], status: "connected", balance: "$23,811" },
    { name: "Phantom", address: "Hx9k...3mPq", chains: ["Solana"], status: "connected", balance: "$7,961" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Connections</div>
        <div style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>Manage exchange APIs and wallet connections for bot execution</div>
      </div>

      {/* Exchanges */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>{Icons.exchange} Exchange APIs</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {exchanges.map(ex => (
            <div key={ex.name} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: ex.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 14, color: ex.color }}>{ex.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: ex.status === "connected" ? "#10B981" : "#D1D5DB", animation: ex.status === "connected" ? "pulseGlow 2s infinite" : "none" }} />
                      <span style={{ fontSize: 11, color: ex.status === "connected" ? "#10B981" : "#9CA3AF", fontWeight: 500 }}>{ex.status === "connected" ? "Connected" : "Not connected"}</span>
                    </div>
                  </div>
                </div>
              </div>
              {ex.status === "connected" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Active Pairs</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, marginTop: 2 }}>{ex.pairs}</div>
                  </div>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>30d Volume</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, marginTop: 2 }}>{ex.volume}</div>
                  </div>
                </div>
              ) : (
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 14, textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>Connect your API keys to enable trading</div>
                </div>
              )}
              <button className={ex.status === "connected" ? "btn-secondary" : "btn-primary"} style={{ width: "100%", justifyContent: "center" }}>
                {ex.status === "connected" ? "Manage Keys" : <>{Icons.plug} Connect</>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wallets */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>{Icons.wallet} Wallet Connections</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {wallets.map(w => (
            <div key={w.name} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{w.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{w.address}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: "#10B981", animation: "pulseGlow 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#10B981", fontWeight: 500 }}>Connected</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F9FAFB", borderRadius: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Chains</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {w.chains.map(c => <span key={c} className="tag" style={{ background: "#E5E7EB", color: "#374151", fontSize: 10 }}>{c}</span>)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Balance</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, marginTop: 2 }}>{w.balance}</div>
                </div>
              </div>
              <button className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>Manage Connection</button>
            </div>
          ))}
          {/* Add Wallet */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #E5E7EB", cursor: "pointer", minHeight: 200, transition: "all 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.background = "#F0FDF4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#fff"; }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", marginBottom: 12 }}>{Icons.wallet}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Add Wallet</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Connect via WalletConnect</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ───
function SettingsView() {
  const [toggles, setToggles] = useState({ notifications: true, emails: true, twoFactor: true, darkMode: false, autoTrade: true, paperMode: false });
  const toggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Settings</div>
        <div style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>Manage your account, security, and trading preferences</div>
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          {Icons.user}
          <span style={{ fontSize: 14, fontWeight: 600 }}>Profile</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 6 }}>Full Name</label>
            <input type="text" defaultValue="Alex Chen" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" defaultValue="alex@cryptiq.io" />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          {Icons.shield}
          <span style={{ fontSize: 14, fontWeight: 600 }}>Security</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "twoFactor", label: "Two-Factor Authentication", desc: "Require 2FA for all sign-ins and withdrawals" },
            { key: "notifications", label: "Push Notifications", desc: "Receive real-time alerts for bot activity and market events" },
            { key: "emails", label: "Email Notifications", desc: "Daily and weekly portfolio summaries via email" },
          ].map(item => (
            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{item.desc}</div>
              </div>
              <div className={`toggle ${toggles[item.key] ? "on" : ""}`} onClick={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Trading */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <span style={{ color: "#10B981" }}>{Icons.zap}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Trading Preferences</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "autoTrade", label: "Auto-Execute Trades", desc: "Allow bots to automatically execute trades on your behalf" },
            { key: "paperMode", label: "Paper Trading Mode", desc: "Simulate trades without using real funds — great for testing new bots" },
          ].map(item => (
            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{item.desc}</div>
              </div>
              <div className={`toggle ${toggles[item.key] ? "on" : ""}`} onClick={() => toggle(item.key)} />
            </div>
          ))}
          <div style={{ padding: "10px 0" }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 6 }}>Default Risk Tolerance</label>
            <select defaultValue="medium">
              <option value="low">Conservative — Lower returns, tighter risk controls</option>
              <option value="medium">Balanced — Moderate risk with steady growth</option>
              <option value="high">Aggressive — Higher potential returns, wider drawdowns</option>
            </select>
          </div>
          <div style={{ padding: "10px 0" }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 6 }}>Max Allocation Per Bot</label>
            <select defaultValue="25">
              <option value="10">10% of portfolio</option>
              <option value="25">25% of portfolio</option>
              <option value="50">50% of portfolio</option>
              <option value="100">No limit</option>
            </select>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 }}>{"</>"}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Developer API</span>
          </div>
          <span className="tag" style={{ background: "#ECFDF5", color: "#065F46", fontSize: 10 }}>For Bot Developers</span>
        </div>
        <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Your API Key</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, marginTop: 4, letterSpacing: 0.5 }}>cq_live_••••••••••••••••••••</div>
          </div>
          <button className="btn-secondary" style={{ fontSize: 11, padding: "5px 12px" }}>Reveal</button>
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Use this key to publish and manage your algorithms on the Cryptiq marketplace. Never share your API key publicly.</div>
      </div>
    </div>
  );
}

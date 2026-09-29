// truex / agents — single-file UI. Rendered by index.html (Babel strips TS + JSX in-browser).
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---------------------------------------------------------------- types */

type PanelId = "sidebar" | "activity";
type Tab = "activity" | "agents" | "goal" | "plan";
type Role = "user" | "agent";
interface Step { label: string; done: boolean }
interface Message { id: number; role: Role; text: string; steps?: Step[]; streaming?: boolean; goal?: string }
type GoalStatus = "running" | "paused" | "done" | "ended";
interface Goal { aid: number; text: string; budget: string; status: GoalStatus; started: number }
interface Conversation { id: number; title: string; time: string; group: "Today" | "Earlier" }
interface Agent {
  id: string; name: string; desc: string; hue: string;
  handle?: string; look?: number; tint?: string; model?: string; reasoning?: string; instructions?: string;
}

/* ---------------------------------------------------------------- data */

const AGENTS: Agent[] = [
  { id: "qlik", name: "Qlik Analyst", desc: "Dashboards, metrics, BI queries", hue: "#8FC5D6" },
  { id: "research", name: "Researcher", desc: "Web research with citations", hue: "#A9D5BE" },
  { id: "writer", name: "Writer", desc: "Docs, release notes, briefs", hue: "#EBCB8B" },
  { id: "ops", name: "Ops", desc: "Runbooks, tickets, on-call", hue: "#C4BDE3" },
];

const CONVERSATIONS: Conversation[] = [
  { id: 1, title: "Prepare an onboarding plan", time: "4:53 PM", group: "Today" },
  { id: 2, title: "Write a short release note", time: "4:24 PM", group: "Today" },
  { id: 3, title: "Market research on AI agents", time: "3:18 PM", group: "Today" },
  { id: 4, title: "Competitor analysis", time: "Mon", group: "Earlier" },
  { id: 5, title: "Q3 product roadmap", time: "Sun", group: "Earlier" },
];

const BUDGETS = [
  { id: "none", label: "No budget", cap: 0 },
  { id: "2", label: "$2 cap", cap: 2 },
  { id: "5", label: "$5 cap", cap: 5 },
  { id: "20", label: "$20 cap", cap: 20 },
];
const budgetOf = (id: string) => BUDGETS.find(b => b.id === id) || BUDGETS[0];

// Agent looks: shaded vector robots drawn in SVG (Robot). Tints are the badge backgrounds; `dot` doubles as the agent hue.
interface Look { name: string; body: string; visor: string; glow: string; face: "line" | "eyes" | "happy"; acc?: string; accColor?: string }
const LOOKS: Look[] = [
  { name: "Graphite", body: "#3A4750", visor: "#1F2A30", glow: "#8FC5D6", face: "line" },
  { name: "Antenna", body: "#F4F7F8", visor: "#2B3F6B", glow: "#A8D3E0", face: "eyes", acc: "antenna" },
  { name: "Navy", body: "#2E4470", visor: "#16213A", glow: "#A8D3E0", face: "line" },
  { name: "Listener", body: "#D5DDE1", visor: "#2B3F6B", glow: "#BCDEE8", face: "happy", acc: "headphones", accColor: "#8FC5D6" },
  { name: "Scout", body: "#D8C3A0", visor: "#3A4750", glow: "#EBCB8B", face: "line", acc: "cap", accColor: "#E07B6E" },
  { name: "Chef", body: "#F4F7F8", visor: "#2B3F6B", glow: "#A8D3E0", face: "eyes", acc: "chef" },
  { name: "Builder", body: "#F4F7F8", visor: "#3A4750", glow: "#EBCB8B", face: "eyes", acc: "hardhat", accColor: "#F2C94C" },
  { name: "Scarf", body: "#3A4750", visor: "#1F2A30", glow: "#F0B999", face: "happy", acc: "scarf", accColor: "#E07B6E" },
  { name: "Mint", body: "#BFE3CF", visor: "#1F2A30", glow: "#A9D5BE", face: "eyes", acc: "antenna" },
  { name: "Lilac", body: "#CFC8EC", visor: "#2B3F6B", glow: "#C4BDE3", face: "happy", acc: "bow", accColor: "#F0A3B5" },
  { name: "Peach", body: "#F5C7A8", visor: "#3A4750", glow: "#F0B999", face: "line", acc: "headphones", accColor: "#3A4750" },
  { name: "Captain", body: "#2E4470", visor: "#16213A", glow: "#A8D3E0", face: "eyes", acc: "cap", accColor: "#8FC5D6" },
];
const TINTS = [
  { id: "ice", label: "Ice", bg: "#EAF5F8", dot: "#8FC5D6" },
  { id: "mint", label: "Mint", bg: "#E7F4ED", dot: "#A9D5BE" },
  { id: "butter", label: "Butter", bg: "#FFF3D9", dot: "#EBCB8B" },
  { id: "peach", label: "Peach", bg: "#FBE9DD", dot: "#F0B999" },
  { id: "lilac", label: "Lilac", bg: "#EFEDF8", dot: "#C4BDE3" },
];
const MODELS = [
  { id: "default", label: "Workspace default", short: "default model" },
  { id: "opus", label: "Claude Opus 5.5", short: "opus 5.5" },
  { id: "sonnet", label: "Claude Sonnet 5.5", short: "sonnet 5.5" },
  { id: "haiku", label: "Claude Haiku 4.5", short: "haiku 4.5" },
];
const REASONING = ["Default", "Low", "Medium", "High"];
const tintOf = (id?: string) => TINTS.find(t => t.id === id) || TINTS[0];
const modelOf = (id?: string) => MODELS.find(m => m.id === id) || MODELS[0];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// Mix a hex colour toward white (amt > 0) or black (amt < 0); used for the robots' shading.
const tone = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16), t = amt < 0 ? 0 : 255, k = Math.abs(amt);
  const ch = (sh: number) => Math.round(((n >> sh) & 255) + (t - ((n >> sh) & 255)) * k).toString(16).padStart(2, "0");
  return "#" + ch(16) + ch(8) + ch(0);
};

const CHAT_STEPS = ["Understanding the request", "Reading 3 workspace documents", "Drafting the answer"];
const GOAL_STEPS = ["Break the goal into checkpoints", "Gather sources from workspace and web", "Draft the deliverable", "Check it against the goal", "Package the result"];
const GOAL_STATUS: Record<GoalStatus, string> = { running: "Working", paused: "Paused", done: "Done", ended: "Ended" };

// Type presets. Fonts load on demand, so only the active preset is fetched.
const TYPE_PRESETS = [
  { id: "editorial", name: "Editorial", note: "Figtree + Newsreader", sample: '"Newsreader", serif',
    href: "family=Figtree:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,6..72,400..500&family=JetBrains+Mono:wght@400;500" },
  { id: "grotesk", name: "Grotesk", note: "Bricolage + Hanken", sample: '"Bricolage Grotesque", sans-serif',
    href: "family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500" },
  { id: "literary", name: "Literary", note: "Newsreader + Inter Tight", sample: '"Newsreader", serif',
    href: "family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500" },
  { id: "geist", name: "Geist", note: "Original V2", sample: '"Geist", sans-serif',
    href: "family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500" },
];

const PLACEHOLDERS = [
  "Ask anything, or type / for commands",
  "Summarize last week's pipeline changes",
  "Compare Q2 vs Q3 revenue by region",
  "Draft a reply to the customer escalation",
];

const RECENT_ACTIVITY = [
  { icon: "check", title: "Prepared onboarding plan", meta: "2 documents · 2 sources", time: "4:53 PM" },
  { icon: "globe", title: "Market research on AI agents", meta: "Web · 12 sources", time: "3:18 PM" },
  { icon: "chart", title: "Q3 product roadmap", meta: "Created diagram", time: "1:02 PM" },
  { icon: "table", title: "Customer feedback analysis", meta: "Analyzed spreadsheet", time: "Yesterday" },
];

/* ---------------------------------------------------------------- icons */

const PATHS: Record<string, string> = {
  sidebar: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 3v18",
  activity: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM15 3v18",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  bot: "M12 8V4H8M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 14h2M20 14h2M9 13v2M15 13v2",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  paperclip: "m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  at: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9",
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  check: "M20 6 9 17l-5-5",
  chart: "M3 3v18h18M7 16l4-6 4 3 5-7",
  table: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M3 15h18M9 3v18",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  chevron: "m6 9 6 6 6-6",
  upDown: "m7 15 5 5 5-5M7 9l5-5 5 5",
  x: "M18 6 6 18M6 6l12 12",
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
  stop: "M6 6h12v12H6z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  plug: "M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z",
  pause: "M8 5v14M16 5v14",
  play: "M7 4v16l13-8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function Icon({ name, size = 18, stroke = 1.75 }: { name: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ---------------------------------------------------------------- hooks */

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem("truex-theme") || ""; } catch { return ""; }
  });
  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("truex-theme", theme); } catch {}
  }, [theme]);
  const isDark = theme === "dark" || (!theme && matchMedia("(prefers-color-scheme: dark)").matches);
  return [isDark ? "dark" : "light", () => setTheme(isDark ? "light" : "dark")];
}

function useTypePreset(): [string, (id: string) => void] {
  const [type, setType] = useState<string>(() => {
    try { return localStorage.getItem("truex-type") || "editorial"; } catch { return "editorial"; }
  });
  useEffect(() => {
    const p = TYPE_PRESETS.find(t => t.id === type) || TYPE_PRESETS[0];
    document.documentElement.setAttribute("data-type", p.id);
    const id = "type-font-" + p.id;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${p.href}&display=swap`;
      document.head.appendChild(link);
    }
    try { localStorage.setItem("truex-type", p.id); } catch {}
  }, [type]);
  return [type, setType];
}

function useHotkeys(map: Record<string, () => void>) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const combo = (e.metaKey || e.ctrlKey ? "mod+" : "") + e.key.toLowerCase();
      const fn = ref.current[combo];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function useClickOutside(ref: { current: HTMLElement | null }, onOut: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOut(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onOut(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [active]);
}

/* ---------------------------------------------------------------- floating dock
   Aceternity-style: icons magnify by cursor distance; label tooltips rise above.
   Size is interpolated from the pointer's x-distance to each item's centre. */

interface DockItem { id: string; label: string; icon: string; kbd?: string; active?: boolean; badge?: boolean; onClick: () => void }

const BASE = 40, PEAK = 60, REACH = 140;

function FloatingDock({ items, groups }: { items: DockItem[]; groups: number[] }) {
  const [mx, setMx] = useState<number | null>(null);
  const reduced = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  return (
    <nav className="dock" aria-label="Workspace"
      onMouseMove={e => !reduced && setMx(e.clientX)} onMouseLeave={() => setMx(null)}>
      {items.map((it, i) => (
        <React.Fragment key={it.id}>
          {groups.includes(i) && <span className="dock-sep" aria-hidden="true" />}
          <DockButton item={it} mx={mx} />
        </React.Fragment>
      ))}
    </nav>
  );
}

function DockButton({ item, mx }: { item: DockItem; mx: number | null }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [center, setCenter] = useState(0);
  useEffect(() => {
    if (mx === null || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCenter(r.left + r.width / 2);
  }, [mx]);
  let size = BASE;
  if (mx !== null && center) {
    const d = Math.min(Math.abs(mx - center), REACH);
    size = BASE + (PEAK - BASE) * Math.cos((d / REACH) * (Math.PI / 2)) ** 2;
  }
  return (
    <button ref={ref} className={"dock-btn" + (item.active ? " is-active" : "")}
      style={{ width: size, height: size }} onClick={item.onClick}
      aria-label={item.label} aria-pressed={item.active}>
      <span className="dock-icon" style={{ transform: `scale(${0.9 + (size - BASE) / (PEAK - BASE) * 0.35})` }}>
        <Icon name={item.icon} size={18} />
      </span>
      {item.badge && <span className="dock-badge" aria-hidden="true" />}
      {item.active && <span className="dock-pip" aria-hidden="true" />}
      <span className="dock-tip" role="tooltip">
        {item.label}{item.kbd && <kbd>{item.kbd}</kbd>}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------- sidebar */

function Sidebar({ open, activeId, onPick, onNew, onSearch }: {
  open: boolean; activeId: number | null; onPick: (c: Conversation) => void; onNew: () => void; onSearch: () => void;
}) {
  const [nav, setNav] = useState("home");
  const groups = ["Today", "Earlier"] as const;
  return (
    <aside className={"panel sidebar" + (open ? " is-open" : "")} aria-hidden={!open}>
      <div className="panel-inner">
        <div className="brand">
          <span className="brand-mark"><Icon name="spark" size={14} stroke={2} /></span>
          <span className="brand-word">truex</span>
          <span className="brand-slash">/</span>
          <span className="brand-sub">agents</span>
        </div>

        <button className="search-trigger" onClick={onSearch} tabIndex={open ? 0 : -1}>
          <Icon name="search" size={15} />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>

        <button className="btn-new" onClick={onNew} tabIndex={open ? 0 : -1}>
          <Icon name="plus" size={16} stroke={2} /> New conversation
          <kbd>⌘J</kbd>
        </button>

        <nav className="side-nav">
          {[["home", "Home", "home"], ["projects", "Projects", "folder"], ["agents", "Agents", "bot"],
            ["knowledge", "Knowledge", "book"]].map(([id, label, icon]) => (
            <button key={id} className={"side-link" + (nav === id ? " is-active" : "")}
              onClick={() => setNav(id)} tabIndex={open ? 0 : -1}>
              <Icon name={icon} size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="side-scroll">
          {groups.map(g => (
            <div key={g} className="side-group">
              <div className="eyebrow">{g}</div>
              {CONVERSATIONS.filter(c => c.group === g).map(c => (
                <button key={c.id} className={"convo" + (activeId === c.id ? " is-active" : "")}
                  onClick={() => onPick(c)} tabIndex={open ? 0 : -1}>
                  <span className="convo-title">{c.title}</span>
                  <span className="convo-time">{c.time}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <button className="side-link side-foot" tabIndex={open ? 0 : -1}>
          <Icon name="gear" size={16} /> Settings
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------- activity panel */

function ActivityPanel({ open, tab, setTab, running, progress, goal, goalSteps, onPause, onResume, onEndGoal, onStartGoal, onClose }: {
  open: boolean; tab: Tab; setTab: (t: Tab) => void; running: boolean; progress: number;
  goal: Goal | null; goalSteps: Step[];
  onPause: () => void; onResume: () => void; onEndGoal: () => void; onStartGoal: () => void; onClose: () => void;
}) {
  const tabs: Tab[] = ["activity", "agents", "goal", "plan"];
  return (
    <aside className={"panel activity" + (open ? " is-open" : "")} aria-hidden={!open}>
      <div className="panel-inner">
        <div className="tabs" role="tablist">
          {tabs.map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={"tab" + (tab === t ? " is-active" : "")}
              onClick={() => setTab(t)} tabIndex={open ? 0 : -1}>
              {t[0].toUpperCase() + t.slice(1)}
              {t === "goal" && goal?.status === "running" && <span className="tab-dot" aria-label="running" />}
            </button>
          ))}
          <button className="icon-btn ghost tab-close" onClick={onClose} aria-label="Close panel" tabIndex={open ? 0 : -1}>
            <Icon name="x" size={15} />
          </button>
        </div>

        {tab === "activity" ? (
          <div className="activity-body">
            <section className={"live" + (running ? " is-running" : "")}>
              <div className="live-head">
                <span className="pulse" aria-hidden="true" />
                <span className="live-title">{running ? "Working" : "Idle"}</span>
                <span className="live-meta">{running ? (goal?.status === "running" ? "Goal in progress" : "Qlik Analyst") : "Waiting for a request"}</span>
              </div>
              <div className="live-card">
                <div className="live-row">
                  <span className="tile"><Icon name={goal?.status === "running" ? "target" : "doc"} size={16} /></span>
                  <div className="grow">
                    <div className="strong">{running ? "Reading workspace sources" : "Last run: onboarding plan"}</div>
                    <div className="muted sm">{running ? "Extracting key points from 3 documents" : "Completed in 38s · 2 sources"}</div>
                  </div>
                  <span className="mono sm muted">{running ? `${Math.round(progress)}%` : "100%"}</span>
                </div>
                <div className="bar"><span style={{ width: `${running ? progress : 100}%` }} /></div>
              </div>
            </section>

            <div className="section-head">
              <span className="eyebrow">Recent</span>
              <button className="link">View all</button>
            </div>
            <ol className="timeline">
              {RECENT_ACTIVITY.map((a, i) => (
                <li key={i}>
                  <span className="tl-dot"><Icon name={a.icon} size={14} /></span>
                  <div className="grow">
                    <div className="strong">{a.title}</div>
                    <div className="muted sm">{a.meta}</div>
                  </div>
                  <span className="muted sm mono">{a.time}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : tab === "goal" ? (
          <GoalView goal={goal} steps={goalSteps} progress={progress}
            onPause={onPause} onResume={onResume} onEnd={onEndGoal} onStart={onStartGoal} />
        ) : (
          <div className="empty-tab">
            <span className="tile lg"><Icon name={tab === "agents" ? "bot" : "chart"} size={20} /></span>
            <div className="strong">No {tab} yet</div>
            <div className="muted sm">They'll appear here once a conversation sets them.</div>
          </div>
        )}
      </div>
    </aside>
  );
}

function GoalView({ goal, steps, progress, onPause, onResume, onEnd, onStart }: {
  goal: Goal | null; steps: Step[]; progress: number;
  onPause: () => void; onResume: () => void; onEnd: () => void; onStart: () => void;
}) {
  if (!goal) return (
    <div className="empty-tab">
      <span className="tile lg"><Icon name="target" size={20} /></span>
      <div className="strong">No active goal</div>
      <div className="muted sm">Give the assistant an outcome. It keeps working until it's done, paused or out of budget.</div>
      <button className="btn-soft" onClick={onStart}><Icon name="target" size={14} />Start a goal</button>
    </div>
  );
  const done = steps.filter(s => s.done).length;
  const pct = goal.status === "done" ? 100 : Math.round(progress);
  const b = budgetOf(goal.budget);
  const used = (pct / 100) * 1.4; // simulated spend
  const started = new Date(goal.started).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="activity-body">
      <div className="goal-head">
        <span className={"goal-status s-" + goal.status}><span className="pulse" aria-hidden="true" />{GOAL_STATUS[goal.status]}</span>
        <span className="muted sm mono">Started {started}</span>
      </div>
      <div className="goal-title">{goal.text}</div>
      <div className="goal-progress">
        <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        <span className="mono sm muted">{pct}%</span>
      </div>
      <dl className="goal-meta">
        <div><dt>Budget</dt><dd>{b.label}</dd></div>
        <div><dt>Used</dt><dd>${used.toFixed(2)}{b.cap ? <span className="muted"> / ${b.cap}</span> : null}</dd></div>
        <div><dt>Checkpoints</dt><dd>{done}/{steps.length}</dd></div>
      </dl>
      <div className="section-head"><span className="eyebrow">Checkpoints</span></div>
      <ol className="checkpoints">
        {steps.map((s, i) => {
          const current = !s.done && i === done && goal.status === "running";
          return (
            <li key={i} className={s.done ? "is-done" : current ? "is-current" : ""}>
              <span className="step-mark">
                {s.done ? <Icon name="check" size={11} stroke={2.5} /> : current ? <span className="spinner" /> : <span className="cp-dot" />}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>
      <div className="goal-actions">
        {goal.status === "running" && <button className="btn-soft" onClick={onPause}><Icon name="pause" size={14} />Pause</button>}
        {goal.status === "paused" && <button className="btn-solid" onClick={onResume}><Icon name="play" size={13} />Resume</button>}
        {(goal.status === "running" || goal.status === "paused") && <button className="btn-ghost" onClick={onEnd}>End goal</button>}
        {(goal.status === "done" || goal.status === "ended") && <button className="btn-soft" onClick={onStart}><Icon name="target" size={14} />New goal</button>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- popovers */

function Popover({ open, onClose, children, className = "" }: {
  open: boolean; onClose: () => void; children: any; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, open);
  if (!open) return null;
  return <div ref={ref} className={"popover " + className} role="dialog">{children}</div>;
}

function AgentMenu({ agents, current, onPick, onNew }: { agents: Agent[]; current: Agent; onPick: (a: Agent) => void; onNew: () => void }) {
  return (
    <div className="menu">
      <div className="eyebrow pad">Choose agent</div>
      {agents.map(a => (
        <button key={a.id} className={"menu-item" + (a.id === current.id ? " is-active" : "")} onClick={() => onPick(a)}>
          <span className="agent-dot" style={{ background: a.hue }} />
          <span className="grow">
            <span className="strong block">{a.name}</span>
            <span className="muted sm">{a.desc}</span>
          </span>
          {a.id === current.id && <Icon name="check" size={15} />}
        </button>
      ))}
      <div className="menu-sep" />
      <button className="menu-item" onClick={onNew}>
        <span className="menu-plus"><Icon name="plus" size={13} stroke={2} /></span>
        <span className="grow strong">New agent</span>
      </button>
    </div>
  );
}

function UserMenu({ theme, onTheme, type, onType }: { theme: string; onTheme: () => void; type: string; onType: (id: string) => void }) {
  return (
    <div className="menu">
      <div className="user-card">
        <span className="avatar">N</span>
        <div>
          <div className="strong">Nitin</div>
          <div className="muted sm">nitin@truex.ai</div>
        </div>
      </div>
      <div className="menu-sep" />
      <button className="menu-item" onClick={onTheme}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
        <span className="grow">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
      <div className="menu-sep" />
      <div className="eyebrow pad">Typeface</div>
      <div className="type-grid" role="radiogroup" aria-label="Typeface">
        {TYPE_PRESETS.map(p => (
          <button key={p.id} role="radio" aria-checked={type === p.id}
            className={"type-opt" + (type === p.id ? " is-active" : "")} onClick={() => onType(p.id)}>
            <span className="type-sample" style={{ fontFamily: p.sample }}>Aa</span>
            <span className="type-name">{p.name}</span>
            <span className="type-note">{p.note}</span>
          </button>
        ))}
      </div>
      <div className="menu-sep" />
      <button className="menu-item"><Icon name="gear" size={15} /><span className="grow">Settings</span></button>
      <button className="menu-item"><Icon name="logout" size={15} /><span className="grow">Sign out</span></button>
    </div>
  );
}

function CommandPalette({ open, onClose, onRun }: { open: boolean; onClose: () => void; onRun: (t: string) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);
  const results = CONVERSATIONS.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;
  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="palette" onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="palette-input">
          <Icon name="search" size={16} />
          <input ref={input} value={q} placeholder="Search conversations…" onChange={e => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && results[idx]) onRun(results[idx].title);
            }} />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list">
          {results.length === 0 && <div className="muted sm pad">No matches for “{q}”</div>}
          {results.map((c, i) => (
            <button key={c.id} className={"menu-item" + (i === idx ? " is-active" : "")}
              onMouseEnter={() => setIdx(i)} onClick={() => onRun(c.title)}>
              <Icon name="doc" size={15} /><span className="grow">{c.title}</span><span className="muted sm mono">{c.time}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- new agent */

function Robot({ look, size = 64 }: { look: number; size?: number }) {
  const L = LOOKS[look] || LOOKS[0];
  // Gradient/filter ids must be unique per instance; useId output has colons, which url(#…) dislikes.
  const id = "rb" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const u = (n: string) => `url(#${id}-${n})`;
  const edge = tone(L.body, -.45);
  const acc = L.accColor || L.body;
  const accEdge = tone(acc, -.4);
  const limb = { fill: u("limb"), stroke: edge, strokeWidth: 1.5 };
  const accLine = { fill: u("acc"), stroke: accEdge, strokeWidth: 1.4, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone(L.body, .38)} />
          <stop offset=".55" stopColor={L.body} />
          <stop offset="1" stopColor={tone(L.body, -.3)} />
        </linearGradient>
        <linearGradient id={`${id}-limb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone(L.body, -.06)} />
          <stop offset="1" stopColor={tone(L.body, -.34)} />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx=".3" cy=".2" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone(L.visor, .24)} />
          <stop offset="1" stopColor={tone(L.visor, -.38)} />
        </linearGradient>
        <radialGradient id={`${id}-screen`} cx=".5" cy=".55" r=".6">
          <stop offset="0" stopColor={L.glow} stopOpacity=".3" />
          <stop offset="1" stopColor={L.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-acc`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone(acc, .32)} />
          <stop offset="1" stopColor={tone(acc, -.22)} />
        </linearGradient>
        <linearGradient id={`${id}-chef`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D6DEE2" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#101820" stopOpacity=".3" />
          <stop offset="1" stopColor="#101820" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse cx="60" cy="109" rx="36" ry="6.5" fill={u("shadow")} />
      {/* pack and legs sit behind the shell */}
      <rect x="13" y="50" width="20" height="38" rx="9" {...limb} />
      <rect x="37" y="82" width="19" height="25" rx="8.5" {...limb} />
      <rect x="64" y="82" width="19" height="25" rx="8.5" {...limb} />
      <path d="M41 101.5h11M68 101.5h11" stroke="#fff" strokeOpacity=".18" strokeWidth="2" strokeLinecap="round" />

      {/* shell: base gradient, soft top-left sheen, right rim light */}
      <rect x="24" y="22" width="72" height="72" rx="31" fill={u("body")} stroke={edge} strokeWidth="1.5" />
      <rect x="24" y="22" width="72" height="72" rx="31" fill={u("sheen")} />
      <path d="M90 46c3.6 10 3.4 24-2 34" fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="3" strokeLinecap="round" />
      {L.acc !== "scarf" && <circle cx="73" cy="81" r="2.2" fill={L.glow} filter={u("glow")} />}

      {L.acc === "scarf" && (
        <g>
          <path d="M72 79l3.5 21c.4 2.2 3.2 2.8 4.6 1.1L87 93l-5.5-15z" {...accLine} />
          <path d="M77 97l1.2 4M81 95.5l1.6 3.6" stroke={accEdge} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M25 71c20 8.5 50 8.5 70 0v9c-20 8.5-50 8.5-70 0z" {...accLine} />
          <path d="M31 75c16 5.5 42 5.5 58 0" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {/* visor: bezel, glass, screen bloom, glowing face, glare */}
      <rect x="35" y="36" width="54" height="33" rx="15" fill={tone(L.visor, -.55)} />
      <rect x="37.5" y="38.5" width="49" height="28" rx="12.5" fill={u("visor")} />
      <rect x="37.5" y="38.5" width="49" height="28" rx="12.5" fill={u("screen")} />
      <g filter={u("glow")}>
        {L.face === "line" && <rect x="51" y="50" width="22" height="5.6" rx="2.8" fill={L.glow} />}
        {L.face === "eyes" && <><circle cx="52" cy="53" r="4.1" fill={L.glow} /><circle cx="72" cy="53" r="4.1" fill={L.glow} /></>}
        {L.face === "happy" && <path d="M47 55.5q5-6.2 10 0M67 55.5q5-6.2 10 0" fill="none" stroke={L.glow} strokeWidth="3.2" strokeLinecap="round" />}
      </g>
      {L.face === "eyes" && <><circle cx="53.4" cy="51.6" r="1.2" fill="#fff" /><circle cx="73.4" cy="51.6" r="1.2" fill="#fff" /></>}
      <path d="M43.5 45c3-2.8 8-3.8 13-3.6" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="80.5" cy="61" r="1.5" fill="#fff" fillOpacity=".35" />

      {L.acc === "antenna" && (
        <g>
          <path d="M60 23V10" stroke={edge} strokeWidth="3" strokeLinecap="round" />
          <rect x="54.5" y="20" width="11" height="4.5" rx="2.25" fill={tone(L.body, -.2)} stroke={edge} strokeWidth="1.2" />
          <circle cx="60" cy="8.5" r="9" fill={L.glow} opacity=".28" />
          <circle cx="60" cy="8.5" r="5.2" fill={L.glow} stroke={tone(L.glow, -.4)} strokeWidth="1.2" />
          <circle cx="58.3" cy="6.8" r="1.6" fill="#fff" opacity=".85" />
        </g>
      )}
      {L.acc === "cap" && (
        <g>
          <path d="M80 33.5c10-1 21 0 27 3 2 1.2 1 4-1.5 4-8 0-17-1-26-2.5z" {...accLine} fill={tone(acc, -.1)} />
          <path d="M26 38C26 10 94 10 94 38c-10-3-58-3-68 0z" {...accLine} />
          <path d="M60 15v21" stroke={accEdge} strokeOpacity=".45" strokeWidth="1.2" />
          <path d="M36 28c5-7 12-10 19-11" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="60" cy="14.5" r="2.6" fill={tone(acc, -.15)} stroke={accEdge} strokeWidth="1" />
        </g>
      )}
      {L.acc === "hardhat" && (
        <g>
          <path d="M26 33C26 4 94 4 94 33z" {...accLine} />
          <rect x="55" y="7.5" width="10" height="25" rx="4" fill={tone(acc, .3)} stroke={accEdge} strokeWidth="1.2" />
          <rect x="17" y="30" width="86" height="7" rx="3.5" {...accLine} fill={tone(acc, -.08)} />
          <path d="M34 24c3-7 9-11 16-13" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}
      {L.acc === "chef" && (
        <g>
          <g fill={u("chef")}>
            <circle cx="44" cy="18" r="10.5" /><circle cx="76" cy="18" r="10.5" /><circle cx="60" cy="13" r="12.5" />
          </g>
          <path d="M41 11c2-2 5-3 8-3M56 5c2-1 5-1.4 7-1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <rect x="36" y="18" width="48" height="15" rx="5" fill={u("chef")} stroke="#B9C4CA" strokeWidth="1.2" />
          <path d="M48 21v9M60 21v9M72 21v9" stroke="#B9C4CA" strokeOpacity=".7" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
      {L.acc === "headphones" && (
        <g>
          <path d="M22 54C22 10 98 10 98 54" fill="none" stroke={tone(acc, -.4)} strokeWidth="7" strokeLinecap="round" />
          <path d="M22 54C22 10 98 10 98 54" fill="none" stroke={tone(acc, .25)} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
          <rect x="13" y="43" width="17" height="27" rx="7.5" {...accLine} />
          <rect x="90" y="43" width="17" height="27" rx="7.5" {...accLine} />
          <path d="M17 49v10M94 49v10" stroke="#fff" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {L.acc === "bow" && (
        <g>
          <path d="M78 20l-11-7c-2-1.2-4 .4-4 2.6v9c0 2.2 2.2 3.4 4 2.4z" {...accLine} />
          <path d="M78 20l11-7c2-1.2 4 .4 4 2.6v9c0 2.2-2.2 3.4-4 2.4z" {...accLine} />
          <circle cx="78" cy="20" r="3.6" {...accLine} fill={tone(acc, -.12)} />
          <path d="M66.5 16.5l3 1.8M89.5 16.5l-3 1.8" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Lanyard hardware: crimp end for the ribbon, swivel, split ring and a clear tab that feeds into the badge slot.
function Clip() {
  const id = "cl" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const metal = `url(#${id}-m)`;
  return (
    <svg className="clip" width="56" height="70" viewBox="0 0 56 70" aria-hidden="true" shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A969D" /><stop offset=".35" stopColor="#F4F7F8" />
          <stop offset=".62" stopColor="#B7C1C6" /><stop offset="1" stopColor="#77838A" />
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".85" /><stop offset="1" stopColor="#EAF2F5" stopOpacity=".6" />
        </linearGradient>
      </defs>
      <rect x="20" y="35" width="16" height="35" rx="4" fill={`url(#${id}-t)`} stroke="rgb(31 42 48 / 24%)" strokeWidth=".8" />
      <path d="M23 39v27" stroke="#fff" strokeOpacity=".9" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="28" cy="47" r="3.3" fill={metal} stroke="#6B777E" strokeWidth=".8" />
      <ellipse cx="28" cy="29" rx="8.5" ry="11" fill="none" stroke="#66727A" strokeWidth="5" />
      <ellipse cx="28" cy="29" rx="8.5" ry="11" fill="none" stroke={metal} strokeWidth="3.2" />
      <rect x="24" y="12" width="8" height="7" rx="1.6" fill={metal} stroke="#6B777E" strokeWidth=".8" />
      <rect x="13.5" y="0" width="29" height="13.5" rx="3" fill={metal} stroke="#6B777E" strokeWidth=".8" />
      <path d="M17 4.5h22M17 8.5h22" stroke="#6B777E" strokeOpacity=".45" strokeWidth=".8" />
    </svg>
  );
}

// Lanyard ID badge. Drag to swing it; it springs back on release.
function Badge({ name, handle, look, tint, model, fresh = false }: {
  name: string; handle: string; look: number; tint: string; model: string; fresh?: boolean;
}) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const end = () => { origin.current = null; setDrag(null); };
  const style = drag ? {
    transform: `translate(${clamp(drag.x * .4, -90, 90)}px, ${clamp(drag.y * .35, -12, 48)}px) rotate(${clamp(-drag.x * .09, -24, 24)}deg)`,
  } : undefined;
  return (
    <div className="lanyard-anchor">
      <div className={"lanyard" + (drag ? " is-drag" : "")} style={style} aria-hidden="true"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); origin.current = { x: e.clientX, y: e.clientY }; setDrag({ x: 0, y: 0 }); }}
        onPointerMove={e => { const o = origin.current; if (o) setDrag({ x: e.clientX - o.x, y: e.clientY - o.y }); }}
        onPointerUp={end} onPointerCancel={end}>
        <div className="lanyard-sway">
          <span className="strap" style={{ "--strap": tintOf(tint).dot } as any} />
          <Clip />
          <div className="badge">
            <span className="badge-slot" />
            <span className="badge-brand">truex</span>
            <div className="badge-top" style={{ background: tintOf(tint).bg }}><Robot look={look} size={150} /></div>
            <div className="badge-body">
              <div className={"badge-name" + (name.trim() ? "" : " is-empty")}>{name.trim() || "Unnamed"}</div>
              <div className="badge-handle">@{handle || "handle"}{fresh && " · new specialist"}</div>
            </div>
            <div className="badge-foot"><span>every capability</span><span>{modelOf(model).short}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#8FC5D6", "#A8D3E0", "#A9D5BE", "#EBCB8B", "#F0B999", "#C4BDE3", "#F2C94C"];

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 56 }, (_, i) => {
    const a = Math.random() * Math.PI * 2, dist = 110 + Math.random() * 220, dot = i % 3 === 0;
    return {
      "--x": `${Math.round(Math.cos(a) * dist)}px`, "--y": `${Math.round(Math.sin(a) * dist * .75 - 70)}px`,
      "--r": `${Math.round(Math.random() * 720 - 360)}deg`, "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      "--w": dot ? "7px" : `${5 + Math.round(Math.random() * 4)}px`, "--h": dot ? "7px" : `${3 + Math.round(Math.random() * 9)}px`,
      "--d": `${Math.round(Math.random() * 140)}ms`, "--t": `${1500 + Math.round(Math.random() * 900)}ms`,
      borderRadius: dot ? "50%" : "2px",
    } as any;
  }), []);
  return <div className="confetti" aria-hidden="true">{bits.map((s, i) => <i key={i} style={s} />)}</div>;
}

function NewAgentDialog({ open, agents, onClose, onCreate, onSayHi }: {
  open: boolean; agents: Agent[]; onClose: () => void; onCreate: (a: Agent) => void; onSayHi: (a: Agent) => void;
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [instructions, setInstructions] = useState("");
  const [look, setLook] = useState(2);
  const [tint, setTint] = useState("ice");
  const [model, setModel] = useState("default");
  const [reasoning, setReasoning] = useState("Default");
  const [created, setCreated] = useState<Agent | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(""); setPurpose(""); setInstructions(""); setLook(2); setTint("ice");
    setModel("default"); setReasoning("Default"); setCreated(null);
    setTimeout(() => nameRef.current?.focus(), 30);
  }, [open]);
  if (!open) return null;

  const handle = slug(name);
  const taken = !!handle && agents.some(a => (a.handle || a.id) === handle);
  const valid = !!handle && !taken;
  const create = () => {
    if (!valid) return;
    const a: Agent = {
      id: "agent-" + Date.now(), handle, name: name.trim(), desc: purpose.trim() || "New specialist",
      hue: tintOf(tint).dot, look, tint, model, reasoning, instructions: instructions.trim(),
    };
    onCreate(a); setCreated(a);
  };

  // Success: no card. The badge drops from the top of the viewport over a dark scrim.
  if (created) return (
    <div className="scrim celebrate" role="dialog" aria-modal="true" aria-labelledby="nad-title"
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      <button className="icon-btn ghost dialog-x" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
      <Confetti />
      <div className="celebrate-stage">
        <Badge name={created.name} handle={created.handle!} look={created.look!} tint={created.tint!} model={created.model!} fresh />
      </div>
      <div className="nad-done-copy celebrate-copy">
        <h2 id="nad-title">{created.name} is on the team</h2>
        <p>Mention <code>@{created.handle}</code> anywhere to wake it. Drag the badge around while you're here.</p>
        <div className="nad-actions">
          <button className="btn-solid lg" onClick={() => onSayHi(created)} autoFocus>Say hi to {created.name}</button>
          <button className="btn-soft lg" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="scrim center" onMouseDown={onClose} onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      <div className="agent-dialog" role="dialog" aria-modal="true"
        aria-labelledby="nad-title" onMouseDown={e => e.stopPropagation()}>
        <button className="icon-btn ghost dialog-x" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>

        <form className="nad-form" onSubmit={e => { e.preventDefault(); create(); }}>
              <div className="nad-head">
                <h2 id="nad-title">New agent</h2>
                <p>A persistent specialist with its own identity and chat, granted every capability. Mention it in groups by its handle.</p>
              </div>

              <label className="field">
                <span className="field-label">Name
                  {handle && <span className={"field-hint" + (taken ? " is-bad" : "")}>{taken ? `@${handle} is taken` : `@${handle}`}</span>}
                </span>
                <input ref={nameRef} className="input" value={name} maxLength={40} placeholder="Research Scout"
                  aria-invalid={taken} onChange={e => setName(e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Purpose</span>
                <input className="input" value={purpose} maxLength={80} placeholder="What this specialist owns" onChange={e => setPurpose(e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Instructions</span>
                <textarea className="input" value={instructions} rows={3} placeholder="Standing instructions injected into every one of its turns"
                  onChange={e => setInstructions(e.target.value)} />
              </label>

              <div className="field">
                <span className="field-label" id="nad-look">Look</span>
                <div className="look-grid" role="radiogroup" aria-labelledby="nad-look">
                  {LOOKS.map((l, i) => (
                    <button key={l.name} type="button" role="radio" aria-checked={look === i} aria-label={l.name} title={l.name}
                      className={"look" + (look === i ? " is-active" : "")} style={{ background: tintOf(tint).bg }} onClick={() => setLook(i)}>
                      <Robot look={i} size={40} />
                    </button>
                  ))}
                </div>
                <div className="tint-row" role="radiogroup" aria-label="Tint">
                  <span className="field-label">Tint</span>
                  {TINTS.map(t => (
                    <button key={t.id} type="button" role="radio" aria-checked={tint === t.id} aria-label={t.label} title={t.label}
                      className={"tint" + (tint === t.id ? " is-active" : "")} style={{ background: t.bg }} onClick={() => setTint(t.id)} />
                  ))}
                </div>
              </div>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Model</span>
                  <span className="select full">
                    <select value={model} onChange={e => setModel(e.target.value)}>
                      {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                    <Icon name="chevron" size={14} />
                  </span>
                </label>
                <label className="field">
                  <span className="field-label">Reasoning</span>
                  <span className="select full">
                    <select value={reasoning} onChange={e => setReasoning(e.target.value)}>
                      {REASONING.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <Icon name="chevron" size={14} />
                  </span>
                </label>
              </div>

              <div className="nad-actions">
                <button type="button" className="btn-soft lg" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-solid lg" disabled={!valid}>Create agent</button>
              </div>
            </form>

            <div className="nad-stage">
              <Badge name={name} handle={handle} look={look} tint={tint} model={model} />
              <span className="nad-stage-note">live preview · drag it around</span>
            </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- chat */

function MessageView({ m, agent }: { m: Message; agent: Agent }) {
  if (m.role === "user") return (
    <div className="msg user">
      <div className="bubble-wrap">
        {m.goal && <span className="goal-tag"><Icon name="target" size={12} />{m.goal}</span>}
        <div className="bubble">{m.text}</div>
      </div>
    </div>
  );
  return (
    <div className="msg agent">
      {agent.look !== undefined
        ? <span className="agent-avatar robot" style={{ background: tintOf(agent.tint).bg }}><Robot look={agent.look} size={24} /></span>
        : <span className="agent-avatar" style={{ background: agent.hue }}><Icon name="spark" size={13} stroke={2} /></span>}
      <div className="grow">
        <div className="msg-meta"><span className="strong">{agent.name}</span>{m.streaming && <span className="muted sm">thinking…</span>}</div>
        {m.steps && (
          <ul className="steps">
            {m.steps.map((s, i) => (
              <li key={i} className={s.done ? "is-done" : ""}>
                <span className="step-mark">{s.done ? <Icon name="check" size={11} stroke={2.5} /> : <span className="spinner" />}</span>
                {s.label}
              </li>
            ))}
          </ul>
        )}
        {m.text && <div className="answer">{m.text}{m.streaming && <span className="caret" />}</div>}
      </div>
    </div>
  );
}

function Composer({ agent, busy, value, setValue, onSend, onStop, onAgentClick, inputRef, rotate = false,
  goalMode, setGoalMode, budget, setBudget }: {
  agent: Agent; busy: boolean; value: string; setValue: (v: string) => void;
  onSend: (t: string) => void; onStop: () => void; onAgentClick: () => void;
  inputRef: { current: HTMLTextAreaElement | null }; rotate?: boolean;
  goalMode: boolean; setGoalMode: (on: boolean) => void; budget: string; setBudget: (b: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  const [ph, setPh] = useState(0);
  const submit = () => { if (value.trim() && !busy) { onSend(value.trim()); setValue(""); } };
  useEffect(() => {
    if (!rotate || value || focus || goalMode) return;
    const t = setInterval(() => setPh(i => (i + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(t);
  }, [rotate, value, focus, goalMode]);
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 240) + "px"; }
  }, [value]);
  const placeholder = goalMode
    ? "Describe the outcome you want. The assistant works until it’s done."
    : rotate ? PLACEHOLDERS[ph] : PLACEHOLDERS[0];
  const toggleGoal = () => { setGoalMode(!goalMode); inputRef.current?.focus(); };
  return (
    <div className={"composer" + (focus ? " is-focus" : "") + (goalMode ? " goal-mode" : "")}>
      {goalMode && (
        <div className="composer-goal-head">
          <Icon name="target" size={15} />
          <span><strong>New goal</strong>The assistant keeps working until the goal is done, paused or out of budget.</span>
          <button className="icon-btn ghost" onClick={() => setGoalMode(false)} aria-label="Cancel goal"><Icon name="x" size={14} /></button>
        </div>
      )}
      <textarea ref={inputRef} rows={1} value={value} placeholder={placeholder}
        aria-label={goalMode ? "Goal" : "Message"} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape" && goalMode) setGoalMode(false);
        }} />
      <div className="composer-bar">
        <button className="chip goal-chip" onClick={toggleGoal} aria-pressed={goalMode}>
          <Icon name="target" size={14} />Goal
        </button>
        {goalMode && (
          <label className="select">
            <span className="sr-only">Budget</span>
            <select value={budget} onChange={e => setBudget(e.target.value)}>
              {BUDGETS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            <Icon name="upDown" size={13} />
          </label>
        )}
        <span className="bar-sep" aria-hidden="true" />
        <button className="icon-btn ghost" aria-label="Attach file"><Icon name="paperclip" size={16} /></button>
        <button className="icon-btn ghost" aria-label="Web search"><Icon name="globe" size={16} /></button>
        <button className="text-btn"><Icon name="spark" size={15} />Tools</button>
        <button className="chip" onClick={onAgentClick}>
          <span className="agent-dot" style={{ background: agent.hue }} />{agent.name}<Icon name="chevron" size={13} />
        </button>
        <span className="grow" />
        {!goalMode && <span className="hint muted sm">⏎ send · ⇧⏎ newline</span>}
        <button className="icon-btn ghost" aria-label="Voice input"><Icon name="mic" size={16} /></button>
        {busy
          ? <button className="send is-stop" onClick={onStop} aria-label="Stop"><Icon name="stop" size={12} stroke={3} /></button>
          : <button className="send" onClick={submit} disabled={!value.trim()} aria-label={goalMode ? "Start goal" : "Send"}><Icon name="arrowUp" size={17} stroke={2.25} /></button>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- app */

const GOAL_REPLY = "Goal complete. I split it into five checkpoints, pulled 9 sources (4 workspace docs and 5 web pages), drafted the deliverable and checked it against what you asked for. The result is attached as a document with a one-page summary on top, and the run stayed well inside budget. Want me to share it, or keep refining a section?";

const REPLY = "Here's a first pass. I pulled the three onboarding docs in the workspace and grouped the plan into weeks: week 1 is access and context (tools, team intros, product walkthrough), week 2 shadows two customer calls and the release process, weeks 3–4 hand over one scoped project with a check-in at day 21. Want me to turn this into a checklist the new hire can tick through?";

function App() {
  const [theme, toggleTheme] = useTheme();
  const [type, setType] = useTypePreset();
  const [panels, setPanels] = useState<Record<PanelId, boolean>>(() => ({ sidebar: false, activity: false }));
  const [tab, setTab] = useState<Tab>("activity");
  const [pop, setPop] = useState<"agent" | "user" | null>(null);
  const [palette, setPalette] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [agent, setAgent] = useState<Agent>(AGENTS[0]);
  const [creating, setCreating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvo, setActiveConvo] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState("");
  const [goalMode, setGoalMode] = useState(false);
  const [budget, setBudget] = useState("none");
  const [goal, setGoal] = useState<Goal | null>(null);
  const timers = useRef<number[]>([]);
  // The in-flight simulated run, kept so a paused goal can resume where it stopped.
  const run = useRef<{ aid: number; reply: string; n: number; step: number; word: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggle = (p: PanelId) => setPanels(s => ({ ...s, [p]: !s[p] }));
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const patch = (aid: number, fn: (m: Message) => Message) => setMessages(ms => ms.map(x => x.id === aid ? fn(x) : x));
  const focusInput = (text?: string) => setTimeout(() => {
    const el = inputRef.current;
    if (el) { el.focus(); if (text) el.setSelectionRange(text.length, text.length); }
  }, 0);

  const newChat = useCallback(() => {
    clearTimers(); run.current = null;
    setBusy(false); setMessages([]); setActiveConvo(null); setDraft(""); setGoal(null); setGoalMode(false);
    focusInput();
  }, []);

  const simulate = () => {
    const r = run.current;
    if (!r) return;
    const { aid, reply, n } = r;
    const words = reply.split(" ");
    const fromStep = r.step, fromWord = r.word;
    let t = 0;
    for (let i = fromStep; i < n - 1; i++) {
      t += 700;
      later(t, () => {
        patch(aid, m => ({ ...m, steps: m.steps!.map((s, j) => j <= i ? { ...s, done: true } : s) }));
        r.step = i + 1; setProgress(8 + ((i + 1) / (n - 1)) * 62);
      });
    }
    t += 300;
    for (let i = fromWord; i < words.length; i++) {
      later(t + (i - fromWord) * 28, () => {
        patch(aid, m => ({ ...m, text: words.slice(0, i + 1).join(" ") }));
        r.word = i + 1; setProgress(70 + ((i + 1) / words.length) * 29);
      });
    }
    later(t + (words.length - fromWord) * 28 + 60, () => {
      patch(aid, m => ({ ...m, streaming: false, steps: m.steps!.map(s => ({ ...s, done: true })) }));
      setBusy(false); setProgress(100); run.current = null;
      setGoal(g => g && g.aid === aid && g.status === "running" ? { ...g, status: "done" } : g);
    });
  };

  const send = (text: string, asGoal: boolean) => {
    const aid = Date.now() + 1;
    const labels = asGoal ? GOAL_STEPS : CHAT_STEPS;
    clearTimers();
    setMessages(m => [...m,
      { id: aid - 1, role: "user", text, goal: asGoal ? (budget === "none" ? "Goal" : `Goal · ${budgetOf(budget).label}`) : undefined },
      { id: aid, role: "agent", text: "", steps: labels.map(label => ({ label, done: false })), streaming: true }]);
    setBusy(true); setProgress(4);
    run.current = { aid, reply: asGoal ? GOAL_REPLY : REPLY, n: labels.length, step: 0, word: 0 };
    if (asGoal) {
      setGoal({ aid, text, budget, status: "running", started: Date.now() });
      setGoalMode(false); setTab("goal");
      if (innerWidth > 900) setPanels(p => ({ ...p, activity: true }));
    } else {
      // A new chat turn replaces the paused run, so a paused goal can no longer resume.
      setGoal(g => g && g.status === "paused" ? { ...g, status: "ended" } : g);
    }
    simulate();
  };

  const pauseGoal = () => {
    clearTimers(); setBusy(false);
    if (run.current) patch(run.current.aid, m => ({ ...m, streaming: false }));
    setGoal(g => g && { ...g, status: "paused" });
  };
  const resumeGoal = () => {
    if (!run.current || !goal || run.current.aid !== goal.aid) return;
    patch(run.current.aid, m => ({ ...m, streaming: true }));
    setBusy(true); setGoal(g => g && { ...g, status: "running" });
    simulate();
  };
  const endGoal = () => {
    clearTimers(); setBusy(false);
    if (run.current) patch(run.current.aid, m => ({ ...m, streaming: false, text: m.text || "Goal ended before completion." }));
    run.current = null;
    setGoal(g => g && { ...g, status: "ended" });
  };
  const stop = () => {
    if (goal?.status === "running") return pauseGoal();
    clearTimers(); setBusy(false); run.current = null;
    setMessages(ms => ms.map(m => m.streaming ? { ...m, streaming: false, text: m.text || "Stopped." } : m));
  };
  const startGoal = (prompt = "") => {
    if (messages.length && !busy) newChat();
    setGoalMode(true); setDraft(prompt); focusInput(prompt);
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages]);

  useHotkeys({
    "mod+k": () => setPalette(p => !p),
    "mod+b": () => toggle("sidebar"),
    "mod+.": () => toggle("activity"),
    "mod+j": newChat,
  });

  const dockItems: DockItem[] = [
    { id: "sidebar", label: "Sidebar", icon: "sidebar", kbd: "⌘B", active: panels.sidebar, onClick: () => toggle("sidebar") },
    { id: "search", label: "Search", icon: "search", kbd: "⌘K", onClick: () => setPalette(true) },
    { id: "new", label: "New chat", icon: "plus", kbd: "⌘J", onClick: newChat },
    { id: "agent", label: "Agent", icon: "bot", active: pop === "agent", onClick: () => setPop(p => p === "agent" ? null : "agent") },
    { id: "activity", label: "Activity", icon: "activity", kbd: "⌘.", active: panels.activity, badge: busy && !panels.activity, onClick: () => toggle("activity") },
    { id: "user", label: "Account", icon: "user", active: pop === "user", onClick: () => setPop(p => p === "user" ? null : "user") },
  ];

  const title = activeConvo ? CONVERSATIONS.find(c => c.id === activeConvo)!.title : messages.length ? "New conversation" : "";
  const empty = messages.length === 0;
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const goalSteps = goal ? messages.find(m => m.id === goal.aid)?.steps || [] : [];
  const goalLive = goal && (goal.status === "running" || goal.status === "paused");
  const openGoalTab = () => { setTab("goal"); setPanels(p => ({ ...p, activity: true })); };

  const composer = (
    <Composer agent={agent} busy={busy} value={draft} setValue={setDraft} onSend={t => send(t, goalMode)} onStop={stop}
      inputRef={inputRef} rotate={empty} onAgentClick={() => setPop(p => p === "agent" ? null : "agent")}
      goalMode={goalMode} setGoalMode={setGoalMode} budget={budget} setBudget={setBudget} />
  );

  return (
    <div className="shell">
      <Sidebar open={panels.sidebar} activeId={activeConvo}
        onPick={c => { newChat(); setActiveConvo(c.id); send(c.title, false); }}
        onNew={newChat} onSearch={() => setPalette(true)} />

      <main className="stage">
        <header className="topbar">
          <div className="crumb">
            {!panels.sidebar && <span className="brand-word sm">truex</span>}
            {title && <><span className="muted">/</span><span className="crumb-title">{title}</span></>}
          </div>
          <div className="status-pill">
            <span className={"pulse" + (busy ? "" : " idle")} aria-hidden="true" />
            <span>{agent.name}</span>
            <span className="muted">·</span>
            <span className="muted">{busy ? (goal?.status === "running" ? "working on goal" : "working") : "ready"}</span>
          </div>
          <div className="top-actions">
            <button className="icon-btn" aria-label="Toggle theme" onClick={toggleTheme}><Icon name={theme === "dark" ? "sun" : "moon"} size={16} /></button>
            <button className="icon-btn" aria-label="Share"><Icon name="share" size={16} /></button>
          </div>
        </header>

        <div className="scroll" ref={scrollRef}>
          {empty ? (
            <div className="hero">
              <div className="hero-greet">
                <span className="agent-dot" style={{ background: agent.hue }} />
                {greeting}, Nitin
              </div>
              <h1>What should we <em>work on</em> today?</h1>
              <div className="hero-composer">{composer}</div>
            </div>
          ) : (
            <div className="thread">{messages.map(m => <MessageView key={m.id} m={m} agent={agent} />)}</div>
          )}
        </div>

        <div className="bottom">
          {!empty && goalLive && (
            <button className="goal-strip" onClick={openGoalTab}>
              <Icon name="target" size={14} />
              <span className="goal-strip-text">{goal!.text}</span>
              <span className="bar"><span style={{ width: `${Math.round(progress)}%` }} /></span>
              <span className={"goal-status s-" + goal!.status}><span className="pulse" aria-hidden="true" />{GOAL_STATUS[goal!.status]}</span>
            </button>
          )}
          {!empty && composer}
          <div className="dock-wrap">
            <FloatingDock items={dockItems} groups={[3, 5]} />
            <Popover open={pop === "agent"} onClose={() => setPop(null)} className="pop-agent">
              <AgentMenu agents={agents} current={agent} onPick={a => { setAgent(a); setPop(null); }}
                onNew={() => { setPop(null); setCreating(true); }} />
            </Popover>
            <Popover open={pop === "user"} onClose={() => setPop(null)} className="pop-user">
              <UserMenu theme={theme} onTheme={toggleTheme} type={type} onType={setType} />
            </Popover>
          </div>
        </div>
      </main>

      <ActivityPanel open={panels.activity} tab={tab} setTab={setTab} running={busy} progress={progress}
        goal={goal} goalSteps={goalSteps} onPause={pauseGoal} onResume={resumeGoal} onEndGoal={endGoal}
        onStartGoal={() => startGoal()} onClose={() => toggle("activity")} />
      <NewAgentDialog open={creating} agents={agents} onClose={() => setCreating(false)}
        onCreate={a => setAgents(list => [...list, a])}
        onSayHi={a => { setCreating(false); newChat(); setAgent(a); const t = `@${a.handle} hi, `; setDraft(t); focusInput(t); }} />
      <CommandPalette open={palette} onClose={() => setPalette(false)}
        onRun={t => { setPalette(false); const c = CONVERSATIONS.find(x => x.title === t)!; newChat(); setActiveConvo(c.id); send(t, false); }} />
    </div>
  );
}

/* ---------------------------------------------------------------- styles */

const CSS = `
.shell { display: flex; height: 100%; padding: 10px; gap: 10px; }
.panel { flex: none; width: 0; opacity: 0; overflow: hidden; transition: width .32s cubic-bezier(.2,.8,.2,1), opacity .2s; }
.panel.is-open { opacity: 1; }
.sidebar.is-open { width: 268px; }
.activity.is-open { width: 340px; }
.panel-inner { height: 100%; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
.sidebar .panel-inner { width: 268px; padding: 14px 12px; gap: 6px; }
.activity .panel-inner { width: 340px; }

.brand { display: flex; align-items: center; gap: 6px; padding: 4px 6px 12px; }
.brand-mark { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: var(--ink); color: var(--bg); }
.brand-word { font-family: var(--font-display); font-weight: 700; font-size: 17px; letter-spacing: -.03em; }
.brand-word.sm { font-size: 22px; font-weight: 800; line-height: 1; letter-spacing: -.04em; }
.brand-slash { color: var(--line-strong); font-size: 16px; }
.brand-sub { color: var(--ink-3); font-weight: 500; }

kbd { font: 500 11px var(--font-mono); color: var(--ink-3); background: var(--surface-3); border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; }
.search-trigger { display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 8px 0 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface-2); color: var(--ink-3); cursor: pointer; text-align: left; }
.search-trigger span { flex: 1; }
.search-trigger:hover { border-color: var(--line-strong); }
.btn-new { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 8px 0 12px; border: 0; border-radius: 10px; background: var(--ink); color: var(--bg); font-weight: 500; cursor: pointer; margin-bottom: 10px; transition: transform .12s; }
.btn-new kbd { margin-left: auto; background: transparent; border-color: color-mix(in srgb, var(--bg) 25%, transparent); color: color-mix(in srgb, var(--bg) 65%, transparent); }
.btn-new:active { transform: scale(.98); }

.side-nav { display: flex; flex-direction: column; gap: 1px; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
.side-link { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 10px; border: 0; border-radius: 9px; background: none; color: var(--ink-2); cursor: pointer; text-align: left; }
.side-link:hover { background: var(--surface-2); color: var(--ink); }
.side-link.is-active { background: var(--surface-3); color: var(--ink); font-weight: 500; }
.side-foot { margin-top: 4px; border-top: 1px solid var(--line); border-radius: 0; padding-top: 4px; height: 42px; }
.side-scroll { flex: 1; overflow: auto; margin: 0 -4px; padding: 0 4px; }
.side-group { padding-top: 14px; }
.eyebrow { font: 500 11px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); padding: 0 10px 6px; }
.eyebrow.pad { padding: 8px 10px 6px; }
.convo { display: flex; width: 100%; align-items: baseline; gap: 8px; padding: 7px 10px; border: 0; border-radius: 9px; background: none; cursor: pointer; text-align: left; color: var(--ink-2); }
.convo:hover { background: var(--surface-2); color: var(--ink); }
.convo.is-active { background: var(--accent-soft); color: var(--ink); }
.convo-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.convo-time { font: 11px var(--font-mono); color: var(--ink-3); flex: none; }

.stage { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
.topbar { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 56px; padding: 0 12px 0 18px; }
.crumb { display: flex; align-items: center; gap: 8px; min-width: 0; }
.crumb-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-pill { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-sm); font-size: 13px; font-weight: 500; }
.top-actions { display: flex; gap: 6px; justify-content: flex-end; }
.pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-2); box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-2) 60%, transparent); animation: pulse 1.6s infinite; flex: none; }
.pulse.idle { animation: none; opacity: .7; }
@keyframes pulse { 70% { box-shadow: 0 0 0 7px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }

.icon-btn { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); cursor: pointer; transition: background .15s, color .15s; }
.icon-btn:hover { color: var(--ink); background: var(--surface-3); }
.icon-btn.ghost { border-color: transparent; background: transparent; width: 32px; height: 32px; }
.icon-btn.ghost:hover { background: var(--surface-3); }

.scroll { position: relative; z-index: 1; flex: 1; overflow: auto; }
.hero { max-width: 720px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px 16px 40px; }
.hero h1 { margin: 0; font-family: var(--font-display); font-size: clamp(28px, 4vw, 44px); line-height: 1.08; font-weight: var(--display-weight); letter-spacing: var(--display-track); text-wrap: balance; }
.hero h1 em { font-family: var(--font-accent); font-style: var(--accent-style); font-weight: var(--accent-weight); font-size: calc(var(--accent-scale) * 1em); letter-spacing: -.01em; color: var(--accent-fg); padding-right: .04em; }
.hero { max-width: 760px; animation: rise .35s ease-out; }
.hero-greet { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px; padding: 5px 12px 5px 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); font-size: 13px; font-weight: 500; box-shadow: var(--shadow-sm); }
.hero-composer { width: 100%; margin-top: 28px; text-align: left; }
.hero-composer .composer { max-width: none; }
.hero-composer .composer textarea { min-height: 76px; }

.thread { max-width: 740px; margin: 0 auto; padding: 16px 20px 24px; display: flex; flex-direction: column; gap: 22px; }
.msg.user { display: flex; justify-content: flex-end; }
.bubble { max-width: 80%; padding: 10px 14px; border-radius: 16px 16px 4px 16px; background: var(--ink); color: var(--bg); }
.msg.agent { display: flex; gap: 12px; animation: rise .3s ease-out; }
.agent-avatar { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; color: var(--accent-ink); flex: none; margin-top: 1px; }
.msg-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px; }
.steps { list-style: none; margin: 0 0 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; font-size: 13px; color: var(--ink-3); }
.steps li { display: flex; align-items: center; gap: 8px; }
.steps li.is-done { color: var(--ink-2); }
.step-mark { display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: var(--surface-3); color: var(--accent-fg); }
.is-done .step-mark { background: var(--accent-soft); }
.spinner { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--line-strong); border-top-color: var(--accent); animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }
.answer { line-height: 1.65; color: var(--ink); }
.caret { display: inline-block; width: 7px; height: 15px; margin-left: 2px; vertical-align: -2px; background: var(--accent); border-radius: 2px; animation: blink 1s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0; } }

.bottom { position: relative; z-index: 3; padding: 0 20px 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.composer { width: 100%; max-width: 740px; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--shadow-md); padding: 12px 10px 8px 12px; transition: border-color .15s, box-shadow .15s; }
.composer.is-focus { border-color: color-mix(in srgb, var(--accent) 45%, var(--line)); box-shadow: var(--shadow-md), 0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent); }
.composer textarea { width: 100%; resize: none; border: 0; outline: none; background: transparent; color: var(--ink); font: inherit; font-size: 15px; padding: 4px 4px 12px; min-height: 60px; line-height: 1.5; }
.composer textarea::placeholder { color: var(--ink-3); }
.composer-bar { display: flex; align-items: center; gap: 2px; }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 8px 0 10px; margin-left: 4px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface-2); font-size: 13px; font-weight: 500; cursor: pointer; }
.chip:hover { border-color: var(--line-strong); }
.agent-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.hint { margin-right: 6px; }
.send { display: grid; place-items: center; width: 34px; height: 34px; margin-left: 4px; border: 0; border-radius: 11px; background: var(--accent); color: var(--accent-ink); cursor: pointer; transition: opacity .15s, transform .12s; }
.send:disabled { opacity: .35; cursor: default; }
.send:not(:disabled):active { transform: scale(.94); }
.send.is-stop { background: var(--ink); color: var(--bg); }

/* type presets */
:root[data-type="editorial"] {
  --font-sans: "Figtree", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Figtree", ui-sans-serif, system-ui, sans-serif;
  --font-accent: "Newsreader", ui-serif, Georgia, serif;
  --display-weight: 600; --display-track: -.035em;
  --accent-style: italic; --accent-weight: 400; --accent-scale: 1.04;
}
:root[data-type="grotesk"] {
  --font-sans: "Hanken Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
  --font-accent: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --display-weight: 650; --display-track: -.045em;
  --accent-style: normal; --accent-weight: 650; --accent-scale: 1;
}
:root[data-type="literary"] {
  --font-sans: "Inter Tight", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Newsreader", ui-serif, Georgia, serif;
  --font-accent: "Newsreader", ui-serif, Georgia, serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --display-weight: 500; --display-track: -.025em;
  --accent-style: italic; --accent-weight: 450; --accent-scale: 1;
}
:root[data-type="geist"] {
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-accent: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --display-weight: 600; --display-track: -.04em;
  --accent-style: normal; --accent-weight: 600; --accent-scale: 1;
}


.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 4px 4px; }
.type-opt { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 8px; align-items: center; padding: 8px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); cursor: pointer; text-align: left; color: var(--ink); }
.type-opt:hover { border-color: var(--line-strong); }
.type-opt.is-active { border-color: color-mix(in srgb, var(--accent) 45%, var(--line)); background: var(--accent-soft); }
.type-sample { grid-row: span 2; font-size: 22px; line-height: 1; width: 30px; text-align: center; }
.type-name { font-size: 13px; font-weight: 600; }
.type-note { font-size: 10.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pop-user { width: 300px; }

/* goal mode */
/* v1 parity: app/chat.css:726-753 */
.composer.goal-mode {
  border-color: var(--accent-soft-2);
  background: var(--surface);
}
.composer-goal-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -4px -2px 6px 0;
  padding: 0 0 0 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink-2);
}
.composer-goal-head > svg {
  flex: none;
  color: var(--accent-fg);
}
.composer-goal-head > span {
  flex: 1;
  min-width: 0;
}
.composer-goal-head strong {
  margin-right: 4px;
  font-weight: 600;
  color: var(--accent-fg);
}
.composer-goal-head .icon-btn { width: 26px; height: 26px; flex: none; color: var(--ink-3); }
.composer.goal-mode.is-focus { border-color: color-mix(in srgb, var(--accent) 40%, var(--accent-soft-2)); }
.chip.goal-chip { margin-left: 0; color: var(--ink-2); }
.chip.goal-chip svg { color: currentColor; }
.chip[aria-pressed="true"] {
  background: var(--accent-soft);
  border-color: transparent;
  color: var(--accent-fg);
}
.select { position: relative; display: inline-flex; align-items: center; margin-left: 6px; }
.select select { appearance: none; -webkit-appearance: none; height: 30px; padding: 0 28px 0 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font: inherit; font-size: 13px; cursor: pointer; }
.select select:hover { border-color: var(--line-strong); }
.select svg { position: absolute; right: 9px; pointer-events: none; color: var(--ink-3); }
.text-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 0; border-radius: 9px; background: none; color: var(--ink-2); font-size: 13px; cursor: pointer; }
.text-btn:hover { background: var(--surface-3); color: var(--ink); }
.bar-sep { width: 1px; height: 18px; background: var(--line); margin: 0 6px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.bubble-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; max-width: 80%; }
.bubble-wrap .bubble { max-width: none; }
.goal-tag { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-fg); font-size: 12px; font-weight: 500; }

.goal-strip { width: 100%; max-width: 740px; display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 8px 0 12px; margin-bottom: -4px; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--line)); background: color-mix(in srgb, var(--accent-soft) 70%, var(--surface)); color: var(--accent-fg); font-size: 13px; cursor: pointer; animation: rise .2s ease-out; }
.goal-strip-text { flex: 1; min-width: 0; text-align: left; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.goal-strip .bar { width: 72px; flex: none; }

.goal-status { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 9px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--surface-3); color: var(--ink-2); flex: none; }
.goal-status .pulse { width: 6px; height: 6px; }
.goal-status.s-running { background: var(--accent-soft); color: var(--accent-fg); }
.goal-status.s-paused .pulse { animation: none; background: var(--warn); }
.goal-status.s-done .pulse { animation: none; background: var(--accent); }
.goal-status.s-ended .pulse { animation: none; background: var(--ink-3); }

.tab-dot { display: inline-block; width: 6px; height: 6px; margin-left: 6px; vertical-align: 2px; border-radius: 50%; background: var(--accent-2); }
.goal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.goal-title { font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.4; letter-spacing: -.01em; margin-bottom: 14px; }
.goal-progress { display: flex; align-items: center; gap: 10px; }
.goal-progress .bar { flex: 1; }
.goal-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 16px 0 0; }
.goal-meta div { padding: 9px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); }
.goal-meta dt { font: 500 10.5px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }
.goal-meta dd { margin: 4px 0 0; font-size: 13px; font-weight: 600; white-space: nowrap; }
.checkpoints { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.checkpoints li { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 8px; font-size: 13px; color: var(--ink-3); }
.checkpoints li.is-done { color: var(--ink-2); }
.checkpoints li.is-current { background: var(--surface-2); color: var(--ink); }
.cp-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--line-strong); }
.goal-actions { display: flex; gap: 8px; margin-top: 18px; }
.btn-solid, .btn-soft, .btn-ghost { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-solid { border: 0; background: var(--accent); color: var(--accent-ink); }
.btn-soft { border: 1px solid var(--line); background: var(--surface); color: var(--ink); }
.btn-soft:hover { background: var(--surface-3); }
.btn-ghost { border: 0; background: none; color: var(--ink-3); }
.btn-ghost:hover { color: var(--ink); }
.empty-tab .btn-soft { margin-top: 10px; }

/* floating dock */
.dock-wrap { position: relative; }
.dock { display: flex; align-items: flex-end; gap: 6px; height: 56px; padding: 0 8px 8px; border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 78%, transparent); backdrop-filter: blur(14px) saturate(1.4); -webkit-backdrop-filter: blur(14px) saturate(1.4);
  border: 1px solid var(--line); box-shadow: var(--shadow-lg); }
.dock-sep { align-self: center; width: 1px; height: 22px; margin: 8px 2px 0; background: var(--line-strong); }
.dock-btn { position: relative; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--line); background: var(--surface-3); color: var(--ink-2); cursor: pointer; padding: 0;
  transition: width .14s ease-out, height .14s ease-out, background .15s, color .15s; }
.dock-btn:hover { color: var(--ink); }
.dock-btn.is-active { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.dock-icon { display: grid; place-items: center; transition: transform .14s ease-out; }
.dock-pip { position: absolute; bottom: -6px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
.dock-badge { position: absolute; top: 1px; right: 1px; width: 9px; height: 9px; border-radius: 50%; background: var(--accent-2); border: 2px solid var(--surface); animation: pulse 1.6s infinite; }
.dock-tip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translate(-50%, 4px); display: flex; gap: 6px; align-items: center; white-space: nowrap; padding: 4px 8px; border-radius: 8px; background: var(--ink); color: var(--bg); font-size: 12px; font-weight: 500; opacity: 0; pointer-events: none; transition: opacity .12s, transform .12s; }
.dock-tip kbd { background: transparent; color: color-mix(in srgb, var(--bg) 60%, transparent); border-color: color-mix(in srgb, var(--bg) 25%, transparent); }
.dock-btn:hover .dock-tip, .dock-btn:focus-visible .dock-tip { opacity: 1; transform: translate(-50%, 0); }

.popover { position: absolute; bottom: calc(100% + 12px); z-index: 20; width: 280px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow-lg); padding: 6px; animation: rise .16s ease-out; }
.pop-agent { left: 50%; transform: translateX(-50%); }
.pop-user { right: 0; }
.menu { display: flex; flex-direction: column; gap: 1px; }
.menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: 9px; background: none; cursor: pointer; text-align: left; color: var(--ink); }
.menu-item:hover, .menu-item.is-active { background: var(--surface-3); }
.menu-sep { height: 1px; background: var(--line); margin: 6px 0; }
.user-card { display: flex; gap: 10px; align-items: center; padding: 8px 10px; }
.avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--ink); color: var(--bg); font-weight: 600; }

/* activity */
.tabs { display: flex; align-items: center; gap: 2px; padding: 8px 8px 0; border-bottom: 1px solid var(--line); }
.tab { position: relative; height: 38px; padding: 0 10px; border: 0; background: none; color: var(--ink-3); cursor: pointer; font-weight: 500; font-size: 13px; }
.tab:hover { color: var(--ink); }
.tab.is-active { color: var(--ink); }
.tab.is-active::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 2px; border-radius: 2px; background: var(--accent); }
.tab-close { margin-left: auto; margin-bottom: 4px; }
.activity-body { flex: 1; overflow: auto; padding: 16px; }
.live-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.live:not(.is-running) .pulse { animation: none; background: var(--ink-3); }
.live-title { font-weight: 600; }
.live-meta { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.live-card { padding: 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface-2); }
.live-row { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.tile { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: var(--accent-soft); color: var(--accent-fg); flex: none; }
.tile.lg { width: 44px; height: 44px; border-radius: 12px; }
.bar { height: 4px; border-radius: 4px; background: var(--surface-3); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 4px; background: var(--accent-2); transition: width .4s ease; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 8px; }
.section-head .eyebrow { padding: 0; }
.link { border: 0; background: none; color: var(--ink-3); font-size: 12px; cursor: pointer; }
.link:hover { color: var(--ink); }
.timeline { list-style: none; margin: 0; padding: 0; position: relative; }
.timeline::before { content: ""; position: absolute; left: 13px; top: 14px; bottom: 14px; width: 1px; background: var(--line); }
.timeline li { position: relative; display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; }
.tl-dot { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); flex: none; }
.empty-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; padding: 24px; }
.empty-tab .tile { margin-bottom: 8px; }

/* palette */
.scrim { position: fixed; inset: 0; z-index: 50; display: flex; justify-content: center; align-items: flex-start; padding: 14vh 16px 16px; background: color-mix(in srgb, var(--ink) 18%, transparent); backdrop-filter: blur(2px); animation: fade .12s; }
@keyframes fade { from { opacity: 0; } }
.palette { width: 100%; max-width: 540px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; animation: rise .16s ease-out; }
.palette-input { display: flex; align-items: center; gap: 10px; padding: 0 14px; height: 52px; border-bottom: 1px solid var(--line); color: var(--ink-3); }
.palette-input input { flex: 1; border: 0; outline: none; background: none; font: inherit; font-size: 15px; color: var(--ink); }
.palette-list { padding: 6px; max-height: 320px; overflow: auto; }

.grow { flex: 1; min-width: 0; }
.strong { font-weight: 500; color: var(--ink); }
.block { display: block; }
.muted { color: var(--ink-3); }
.sm { font-size: 12px; }
.mono { font-family: var(--font-mono); }
.pad { padding: 10px; }

@media (max-width: 900px) {
  .activity.is-open { position: fixed; right: 10px; top: 10px; bottom: 10px; z-index: 30; }
  .activity.is-open .panel-inner { box-shadow: var(--shadow-lg); }
  .hint { display: none; }
}
/* new agent */
.menu-plus { display: grid; place-items: center; width: 20px; height: 20px; margin: 0 -6px; border-radius: 6px; border: 1px dashed var(--line-strong); color: var(--ink-2); flex: none; }
.agent-avatar.robot { overflow: hidden; }
.scrim.center { align-items: center; padding: 16px; }
.agent-dialog { position: relative; min-width: 0; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); width: 100%; max-width: 920px; max-height: calc(100dvh - 32px); background: var(--surface); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow-lg); overflow: hidden; animation: rise .18s ease-out; }
.dialog-x { position: absolute; top: 12px; right: 12px; z-index: 3; }
.nad-form { display: flex; flex-direction: column; gap: 16px; padding: 24px 24px 20px; overflow: auto; }
.nad-head h2 { margin: 0 0 4px; font: var(--display-weight) 20px/1.2 var(--font-display); letter-spacing: -.02em; }
.nad-head p { margin: 0; color: var(--ink-2); font-size: 13.5px; max-width: 52ch; }
.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.field-label { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 12.5px; font-weight: 500; color: var(--ink-2); }
.field-hint { font: 12px var(--font-mono); color: var(--accent-text); }
.field-hint.is-bad { color: var(--error-text); }
.input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--border-control); border-radius: 10px; background: var(--surface); color: var(--ink); font: inherit; font-size: 14px; transition: border-color .15s, box-shadow .15s; }
.input::placeholder { color: var(--ink-3); }
.input:focus { outline: none; border-color: var(--accent-2); box-shadow: 0 0 0 3px var(--accent-soft); }
.input[aria-invalid="true"] { border-color: var(--error-text); }
textarea.input { height: auto; min-height: 84px; padding: 10px 12px; resize: vertical; line-height: 1.5; }
.look-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
.look { display: grid; place-items: center; aspect-ratio: 1; padding: 0; border: 1.5px solid transparent; border-radius: 12px; cursor: pointer; transition: transform .12s, border-color .15s, background .25s; }
.look:hover { transform: translateY(-1px); }
.look.is-active { border-color: var(--ink); }
.tint-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.tint-row .field-label { margin-right: 4px; }
.tint { width: 26px; height: 26px; padding: 0; border-radius: 50%; border: 1px solid var(--line-strong); cursor: pointer; }
.tint.is-active { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--ink); }
.field-row { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 12px; }
.select.full { display: flex; margin-left: 0; }
.select.full select { width: 100%; height: 40px; padding: 0 32px 0 12px; border-color: var(--border-control); border-radius: 10px; font-size: 14px; }
.nad-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
.btn-solid.lg, .btn-soft.lg { height: 38px; padding: 0 16px; font-size: 14px; }
.btn-solid:hover:not(:disabled) { background: var(--accent-2); }
.btn-solid:disabled { opacity: .45; cursor: not-allowed; }

.nad-stage { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 540px; padding: 16px; background: var(--surface-3); border-left: 1px solid var(--line); overflow: hidden; }
.nad-stage-note { position: relative; font: 12px var(--font-mono); color: var(--ink-3); }
.lanyard-anchor { position: absolute; top: -18px; left: 0; right: 0; display: flex; justify-content: center; pointer-events: none; }
.lanyard { pointer-events: auto; transform-origin: 50% 0; transition: transform .7s cubic-bezier(.34, 1.56, .64, 1); cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
.lanyard.is-drag { transition: none; cursor: grabbing; }
.lanyard-sway { display: flex; flex-direction: column; align-items: center; transform-origin: 50% 0; animation: sway 6s ease-in-out infinite; }
.lanyard.is-drag .lanyard-sway { animation-play-state: paused; }
@keyframes sway { 0%, 100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }
.strap { position: relative; width: 24px; height: 92px; box-shadow: 0 2px 6px rgb(31 42 48 / 18%);
  background:
    repeating-linear-gradient(0deg, rgb(255 255 255 / 0) 0 2px, rgb(255 255 255 / 16%) 2px 3px),
    linear-gradient(90deg, color-mix(in srgb, var(--strap) 70%, #1F2A30) 0%, var(--strap) 22%, color-mix(in srgb, var(--strap) 65%, #fff) 50%, var(--strap) 78%, color-mix(in srgb, var(--strap) 70%, #1F2A30) 100%); }
.strap::before, .strap::after { content: ""; position: absolute; top: 0; bottom: 0; border-left: 1px dashed rgb(255 255 255 / 65%); }
.strap::before { left: 3.5px; }
.strap::after { right: 3.5px; }
.clip { display: block; position: relative; z-index: 2; margin-top: -6px; filter: drop-shadow(0 2px 2px rgb(31 42 48 / 22%)); }
.badge { position: relative; width: 256px; margin-top: -16px; border-radius: 18px; background: #FFFFFF; color: #1F2A30; overflow: hidden;
  box-shadow: 0 1px 1px rgb(31 42 48 / 8%), 0 4px 10px -2px rgb(31 42 48 / 12%), 0 26px 50px -16px rgb(31 42 48 / 42%); }
/* laminate: hairline edge */
.badge::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 70%), inset 0 0 0 1.5px rgb(31 42 48 / 6%); }
.badge-slot { position: absolute; top: 12px; left: 50%; z-index: 1; width: 40px; height: 8px; margin-left: -20px; border-radius: 4px;
  background: rgb(31 42 48 / 16%); box-shadow: inset 0 1px 2px rgb(31 42 48 / 40%), 0 1px 0 rgb(255 255 255 / 75%); }
.badge-brand { position: absolute; z-index: 1; top: 10px; left: 16px; font: 800 12px var(--font-display); letter-spacing: -.03em; color: rgb(31 42 48 / 55%); }
.badge-top { position: relative; display: grid; place-items: center; height: 188px; padding-top: 12px; transition: background .25s; }
.badge-body { padding: 14px 18px 12px; }
.badge-name { font: 700 24px/1.15 var(--font-display); letter-spacing: -.03em; overflow-wrap: anywhere; }
.badge-name.is-empty { color: #A3AFB5; }
.badge-handle { margin-top: 4px; font: 500 11px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: #4E6C76; overflow-wrap: anywhere; }
.badge-foot { display: flex; justify-content: space-between; gap: 12px; padding: 10px 18px 14px; border-top: 1px dashed #E3ECEF; font: 11px var(--font-mono); white-space: nowrap; color: #5F6D73; }

.nad-stage.done { min-height: 480px; justify-content: flex-end; border-left: 0; border-bottom: 1px solid var(--line); }
.nad-done-copy { padding: 22px 24px 24px; text-align: center; }
.nad-done-copy h2 { margin: 0 0 6px; font: var(--display-weight) 26px/1.2 var(--font-display); letter-spacing: var(--display-track); }
.nad-done-copy p { margin: 0 auto 18px; max-width: 38ch; color: var(--ink-2); }
.nad-done-copy code { padding: 1px 6px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-3); color: var(--ink); font: 500 13px var(--font-mono); }
.nad-done-copy .nad-actions { justify-content: center; }
.scrim.celebrate { flex-direction: column; align-items: stretch; justify-content: flex-end; padding: 0; overflow: hidden; background: rgb(12 15 17 / 78%); backdrop-filter: blur(6px); animation: fade .25s; }
.scrim.celebrate .dialog-x { position: fixed; top: 16px; right: 16px; color: #F4F7F8; }
.scrim.celebrate .confetti { position: fixed; top: 42%; }
.celebrate-stage { position: absolute; inset: 0; pointer-events: none; }
.celebrate-stage .lanyard-anchor { top: 0; animation: drop .9s cubic-bezier(.34, 1.56, .64, 1); }
.celebrate-stage .strap { height: clamp(24px, 16vh, 180px); }
@keyframes drop { from { transform: translateY(-110%); } }
.celebrate-copy { position: relative; z-index: 3; padding: 0 16px max(40px, 6vh); color: #F4F7F8; animation: rise .4s .35s ease-out backwards; }
.celebrate-copy h2 { font-size: 32px; }
.celebrate-copy p { color: rgb(244 247 248 / 72%); }
.celebrate-copy code { border-color: rgb(255 255 255 / 16%); background: rgb(255 255 255 / 8%); color: #F4F7F8; }
@media (max-height: 720px) { .celebrate-stage .strap { height: 20px; } .celebrate-copy h2 { font-size: 26px; } }
.confetti { position: absolute; left: 50%; top: 60%; width: 0; height: 0; pointer-events: none; z-index: 2; }
.confetti i { position: absolute; left: 0; top: 0; width: var(--w); height: var(--h); background: var(--c); opacity: 0; animation: burst var(--t) cubic-bezier(.2, .7, .35, 1) var(--d) forwards; }
@keyframes burst {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(.5); }
  45% { opacity: 1; transform: translate(var(--x), var(--y)) rotate(calc(var(--r) * .5)) scale(1); }
  100% { opacity: 0; transform: translate(calc(var(--x) * 1.15), calc(var(--y) + 170px)) rotate(var(--r)) scale(1); }
}
@media (max-width: 760px) {
  .agent-dialog { grid-template-columns: minmax(0, 1fr); overflow: auto; }
  .nad-form { overflow: visible; padding: 20px 16px; }
  .nad-stage { order: -1; min-height: 380px; border-left: 0; border-bottom: 1px solid var(--line); }
  .nad-stage .strap { height: 56px; }
  .look-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .field-row { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .goal-strip .bar { display: none; }
  .shell { padding: 0; gap: 0; }
  .stage { border-radius: 0; border: 0; }
  .sidebar.is-open { position: fixed; left: 0; top: 0; bottom: 0; z-index: 30; }
  .sidebar .panel-inner { border-radius: 0 16px 16px 0; box-shadow: var(--shadow-lg); }
  .activity.is-open { right: 0; top: 0; bottom: 0; width: min(340px, 100vw); }
    .bottom { padding: 0 16px 12px; }
  .topbar { padding: 0 8px 0 16px; }
  .crumb { display: none; }
  .topbar { grid-template-columns: auto 1fr auto; }
  .status-pill { grid-column: 1; }
}
`;

const style = document.createElement("style");
style.textContent = CSS;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

# Session activity panel: changes and how to apply them

Everything here lives in `app.tsx`. The clickable reference is `design/secondary-sidebar.html`.

## 1. Layout switch (one line)

```ts
// Page frame. "main": sidebar, chat and panel are three cards. "design": tinted frame, flat sidebar, two cards.
const LAYOUT: "main" | "design" = "main";
```

The shell gets the matching class:

```tsx
<div className={"shell layout-" + LAYOUT}>
```

The base CSS is the main layout. The design layout only adds overrides:

```css
.layout-design { background: var(--surface-3); }
.layout-design .sidebar .panel-inner { background: transparent; border-color: transparent; box-shadow: none; }
.layout-design .side-link.is-active, .layout-design .convo.is-active { background: var(--surface); box-shadow: var(--shadow-sm); }
/* inside @media (max-width: 720px) */
.layout-design .sidebar .panel-inner { background: var(--surface-3); border-color: var(--line); box-shadow: var(--shadow-lg); }
```

## 2. Panel width: two fixed sizes

Users can't set their own width. The panel is either 360px or 560px, and a button in the panel header switches between them. There is no drag handle and nothing is saved.

```ts
type PanelSize = "min" | "max";
const PANEL_W: Record<PanelSize, number> = { min: 360, max: 560 };
const PANEL_SIZE_DEFAULT: Record<"list" | "detail", PanelSize> = { list: "min", detail: "max" };
// The chat keeps at least this much room; the sidebar gives way first, then the panel floats.
const CHAT_MIN: Record<PanelSize, number> = { min: 480, max: 640 };
const SIDEBAR_W = 268, GAP = 10;
```

- **Default size per view:** the list opens at `min` and a helper's detail opens at `max`. Each view remembers its own size until the page reloads.
- **Making room:** `fitPanel` decides whether the sidebar stays and whether the panel floats over the chat.

```ts
function fitPanel(vw: number, want: number, chatMin: number, sidebarOpen: boolean, panelOpen: boolean) {
  const width = Math.min(want, vw - 2 * GAP);
  if (vw <= 720) return { width, sidebar: !panelOpen, overlay: false };  // phone: one drawer at a time
  if (!panelOpen || vw <= 900) return { width, sidebar: true, overlay: false };
  const chat = vw - 2 * GAP - width - GAP;
  if (!sidebarOpen || chat - SIDEBAR_W - GAP >= chatMin) return { width, sidebar: true, overlay: !sidebarOpen && chat < chatMin };
  if (chat >= chatMin) return { width, sidebar: false, overlay: false };
  return { width, sidebar: false, overlay: true };
}
```

In `App`:

```ts
const [sizes, setSizes] = useState(PANEL_SIZE_DEFAULT);
const detail = tab === "agents" && helpers.some(h => h.id === openHelper);
const mode = detail ? "detail" : "list";
const size = sizes[mode];
const fit = fitPanel(vw, PANEL_W[size], CHAT_MIN[size], panels.sidebar, panels.activity);
const toggleWide = () => { setSizes(s => ({ ...s, [mode]: s[mode] === "max" ? "min" : "max" })); };
const sidebarShown = panels.sidebar && fit.sidebar;
```

`vw` is state that a `resize` listener keeps up to date. Pass `fit.width` and `fit.overlay` to the panel, which sets `style={{ "--pw": width + "px" }}` and adds the `is-overlay` class.

## 3. Opening the sidebar while the panel is wide

This fixes the bug where the wide panel and the sidebar overlapped the chat. Opening the sidebar always wins: the panel shrinks to `min`, and if even that doesn't fit, the panel closes.

```ts
const sidebarFits = (s: PanelSize) => fitPanel(vw, PANEL_W[s], CHAT_MIN[s], true, panels.activity).sidebar;
const toggleSidebar = () => {
  if (sidebarShown) return toggle("sidebar");
  if (panels.activity && !sidebarFits(size)) {
    if (size === "max" && sidebarFits("min")) setSizes(s => ({ ...s, [mode]: "min" }));
    else setPanels(p => ({ ...p, activity: false }));
  }
  setPanels(p => ({ ...p, sidebar: true }));
};
```

Wire `toggleSidebar` to `mod+b` and to the dock's Sidebar button, whose active state should be `sidebarShown`. Render `<Sidebar open={sidebarShown}>`.

## 4. Panel header and tabs

- **Title row:** "Session activity" gets its own row above the tabs, holding the expand/shrink and close buttons. This keeps the ✕ from being pushed off the tab row at 360px.
- **Tabs:** `activity`, `agents`, `goal`, `plan` and `insights`.
  - Agents shows a count badge, with class `is-live` while helpers run.
  - Plan shows `done/total`.

```tsx
<div className="p-head">
  <Icon name="pulse" size={15} />
  <h2 className="p-title">Session activity</h2>
  <button className="icon-btn ghost tab-size" onClick={onToggleWide} aria-pressed={wide}
    aria-label={wide ? "Shrink panel" : "Expand panel"}><Icon name={wide ? "shrink" : "expand"} size={14} /></button>
  <button className="icon-btn ghost tab-close" onClick={onClose} aria-label="Close panel"><Icon name="x" size={15} /></button>
</div>
```

New icon paths:

```ts
pulse: "M3 12h4l3-8 4 16 3-8h4",
expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
shrink: "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",
chevronR: "m9 6 6 6-6 6",
chevronL: "m15 6-6 6 6 6",
```

Tabs must not wrap. Use `.tab { display: inline-flex; flex-shrink: 0; white-space: nowrap; padding: 0 8px; }` with `.tabs { gap: 0; overflow-x: auto; }`. The size button is hidden at 720px and below.

## 5. Helpers (sub-agents)

**Data.** Add these types, then the `HELPER_TEMPLATES` constant (Atlas/Docs, Birch/Access, Cedar/Shadowing), `HELPER_STATUS`, `DELEGATED_STEP = 1`, `MAIN_TOKENS = 8200` and `CONTEXT_WINDOW = 258_000`. Also add `ms?: number` to `Message`.

```ts
type HelperStatus = "running" | "done" | "stopped";
interface Helper { id: string; aid: number; name: string; role: string; task: string; tone: number; model: string;
  output: { h: string; items: string[] }[]; log: [number, "" | "tool" | "err", string, string?][];
  tokens: number; tools: number; ms: number; warn?: string; warnLabel?: string; status: HelperStatus; start: number; end?: number; }
```

**Run simulation.**
- **Spawning:** when the step loop reaches `DELEGATED_STEP`, call `spawnHelpers(aid)`. This creates the helpers 150ms apart, marks each one done after its `ms`, and delays the next step by the longest helper time.
- **Finish:** the final step records `ms: Date.now() - started` on the message.
- **Stopping:** `stopHelpers()` marks running helpers as stopped. Call it from stop, pause goal and end goal.
- **New chat:** clear `helpers`, `openHelper` and `lit`.

**Clock.** `useNow(active)` ticks every 250ms while any helper is running, and the live durations use it.

**Components**, placed before `Composer`:

| Component | Where | What it shows |
|---|---|---|
| `HelperCard` | Chat, inside the answer | "N helpers · N done", total time. One row per helper, with an always-visible "Open ›" link |
| `HelperAvatar` | Everywhere | Letter tile in the helper's color |
| `AgStatusChip` | Agents tab, detail | Running / Finished / Stopped |
| `AgentsTab` | Agents tab | Summary line, a timeline with a duration per lane, a card per helper |
| `HelperDetail` | Agents tab | Back, previous/next and "1 of 3"; a stats row (status, duration, tokens, tool calls); warning banner; Output/Task/Transcript tabs; Copy output. Esc goes back |
| `PlanTab` | Plan tab | Progress bar and steps. The step handed to helpers shows their avatars |
| `InsightsTab` | Insights tab | Average and slowest time, tokens, helper count, tokens by agent, time by agent, main-agent context meter |

**Answer footer.** A finished answer shows its time and tokens underneath:

```tsx
{!m.streaming && m.ms !== undefined && (
  <div className="msg-foot">{fmtMs(m.ms)} · {fmtK(MAIN_TOKENS + helpers.reduce((n, h) => n + (h.status === "done" ? h.tokens : 0), 0))} tokens</div>
)}
```

**Opening a helper.** `openHelperDetail(id)` switches to the Agents tab, sets `openHelper` and opens the panel. `pickTab` clears `openHelper`, so clicking another tab leaves the detail view. Render the tab body with `key={tab}` rather than `key={tab + openHelper}`, so previous/next keeps keyboard focus.

**Hover sync.** `lit` holds the helper under the pointer in either the chat or the panel, and both places highlight that row.

## 6. Helper colors

These passed the palette validator in light and dark mode. Every color reaches at least 4.5:1 contrast on its soft tint.

| Token | Light | Light soft | Dark | Dark soft |
|---|---|---|---|---|
| `--tone-0` | `#2872b8` | `#eef5fc` | `#3691cd` | `#0f1f2c` |
| `--tone-1` | `#0f7a55` | `#e6f5ee` | `#199e70` | `#0e211a` |
| `--tone-2` | `#b84a1b` | `#fcece4` | `#d95926` | `#24120a` |
| `--tone-main` | `#6b6b6b` | `#f0f0f0` | `#8f8f8f` | `#262626` |

Define the dark values twice: under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and under `:root[data-theme="dark"]`. Then `.tone-N { --t: var(--tone-N); --ts: var(--tone-N-soft); }`.

## 7. Gotchas

- The styles are one JS template literal (``const CSS = `...` ``), so the CSS can't contain backticks or `${`.
- `index.html` compiles `app.tsx` in the browser, so there are no imports. The hooks come from the global `React`.
- New CSS class prefixes: `p-head`, `tab-*`, `hcard-*`, `msg-foot`, `ag-*`, `h-av`, `pl-*`, `in-*`, `tone-*`, `layout-*`.

## 8. Check after applying

Serve with `python3 -m http.server 8000`, open `http://localhost:8000/index.html` and send a message.

| Window | Expected |
|---|---|
| 1600px | List 360 and detail 560, sidebar stays |
| 1470px, panel expanded, press ⌘B | Sidebar opens, panel drops to 360 |
| 1180px, expanded | Panel floats over the chat. ⌘B opens the sidebar and the panel drops to 360 |
| 1050px, expanded, press ⌘B | Sidebar opens, panel closes |
| 390px (phone) | Only one drawer open at a time, size button hidden |
| 360px panel | All five tabs, expand and ✕ visible, no wrapping |

Also check:
- Esc in the detail view returns to the list.
- Clicking another tab closes the detail view.
- After Next helper, the detail opens on Output.
- Light and dark mode both look right.

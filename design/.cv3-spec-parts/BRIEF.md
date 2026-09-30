# Conversation v3 dev spec: fragment brief

You write ONE fragment of `design/convo-v3-dev-spec.html`, the build spec a development team will implement. `assemble.py` joins `shell.html` and nine fragments. **Write only your own file in `design/.cv3-spec-parts/`.** Never edit anything else. The wireframe (`design/convo-v3-wireframe.html`, `design/.cv3-parts/*`) and the r2 files are read-only inputs.

## Finding your schema range fast
`design/.cv3-spec-parts/schema-headings.txt` lists every `##`/`###`/`####` heading in `chat-ui-schema.md` with its line number. Read that first, then Read the schema with `offset`/`limit` for your range. Top-level ranges: §1 52-822 · §2 823-1423 · §3 1424-2194 · §4 2195-2708 · §5 2709-3224 · §6 3225-4356 · §7 4357-5060 · §8 5061-5425. If Bash or search tools are unavailable, don't stop: use Read with offsets.

## Inputs (read-only)
- `chat-ui-schema.md` (repo root): the source of truth for today's code, data and values. Use `grep -n '^## \|^### \|^#### '` to find your range, then read it fully.
- `design/.cv3-parts/<name>.html`: the v3 wireframe fragment(s) for your area. This is the target design. Read `design/.cv3-parts/BRIEF.md` for its hard facts, which still apply.
- `design/truex-design-spec.html`: the existing TrueX design spec, with the current token, type, component and panel values. Grep for your topic and reuse exact values from it.
- `design/convo-v3-plan.html`: the approved plan and phases.
- `design/.cv3-spec-parts/shell.html`: the available classes (read the `<style>` block).

## What "complete" means
A developer builds from this spec alone, without guessing. For **every component** in your area, write one block:

```html
<div class="comp" id="<prefix>-<slug>">
  <header><h4>ComponentName</h4><span class="tag exists|derive|backend|proposal">…</span><span class="tag phase">P1</span>
    <span class="path">components/v2/foo.tsx · replaces LegacyFoo</span></header>
  <div class="body">
    <p>One or two sentences on its purpose.</p>
    <h4>Anatomy and sizes</h4> <!-- a dl.kv or table: every part with px values, radius, gap, padding, font preset -->
    <h4>Tokens</h4>            <!-- which color/space/type tokens each part uses -->
    <h4>States</h4>            <!-- table: state · trigger · visual change · copy -->
    <h4>Data</h4>              <!-- a TS interface in <pre><code> with real field names from the schema; mark new fields with // BE-xx -->
    <h4>Behavior</h4>          <!-- rules, ordering, timing (ms), limits, edge cases -->
    <h4>Keyboard and a11y</h4> <!-- keys, focus order, roles, aria labels, live-region text -->
    <h4>Copy</h4>              <!-- exact strings -->
    <h4>Acceptance</h4>        <!-- ul.chk of testable checks -->
  </div>
</div>
```
Leave out a subsection only if it doesn't apply to that component. You may add a small live `.specimen` rendering. It must use only shell tokens, and you may add a `<style>` scoped with your prefix (below). Never use a literal color in a component rule.

## Tag rules
- Tag each component, and any state or field that differs from the component's tag.
- Every `backend` item cites a `BE-xx` id from the list below. If you need a backend item that isn't listed, write it as `BE-NEW: <short name>` and add it to your section's "New backend items" table.
- Every unconfirmed value or behavior is `proposal` and cites a `D-xx` id. If it isn't listed, use `D-NEW: <question>` and add it to your "New decisions" table, with the default you chose.
- Values from the schema or the existing spec are facts. Anything else is a proposal. **Never present an invented value as fact.**
- Sample content goes in a `.note.warn` or is labeled "Example". Names, model ids and error codes must come from data fields, never be hard-coded.

## Canonical backend ids
BE-01 credentials on fetch/EventSource + CORS for exact origin · BE-02 `PendingRequest.turnId`, `createdAt`, `threadId` · BE-03 regenerate / edit-and-resend / branch endpoints · BE-04 live span + item events, emit `diff.updated` · BE-05 `TurnTrace.status` enum, `StepSpan.error`, resume turn, retry step · BE-06 `mcp.status` payload (state, toolCount, authRequired) + OAuth sign-in · BE-07 `PATCH`/`DELETE /api/agents/:id` · BE-08 per-helper usage, stable helper identity, parent threadId · BE-09 viewer rules: `ownerName`, trace visibility, request access, duplicate chat · BE-10 per-session delegation mode · BE-11 cost in currency, thinking duration · BE-12 checkpoints and restore · BE-13 `citations[]` on messages · BE-14 versioned conversation files (canvas) · BE-15 per-session tool list + `mentions[]` on sent messages · BE-16 session list `turnState`, `pendingCount`, archived filter, content search · BE-17 `/api/me` (name, email, picture) + sign-out · BE-18 `AgentSummary.starterPrompts[]` · BE-19 Share endpoint · BE-20 privacy finding resource/agent/stepId + exclusion rule · BE-21 rate-limit reset time

## Canonical decisions
D-01 Fidelity: this spec + wireframe, with high-fidelity P1 screens later (default) · D-02 Model/agent pickers live as composer chips; the status pill keeps the detail view (default) · D-03 P3 features ship behind a flag (default) · D-04 Waterfall, model context and masked privacy samples are dev-mode only (default) · D-05 Enter while running queues; Steer is an explicit button (default) · D-06 Esc on a docked request = Cancel, only after menus close (default) · D-07 Status pill distinguishes helper requests once BE-02 threadId exists (default: no distinction yet) · D-08 Code block collapse threshold: 30 lines (default)

## Hard facts (never contradict)
Everything in `design/.cv3-parts/BRIEF.md` "Hard facts". Also: new tokens (spacing `--sp-*`, z-index `--z-*`, motion `--dur-*`/`--ease-*`, `--ink-3:#67757C`, button fill `--accent-fg`) are defined in fragment a (foundations). Other fragments reference them by name.

## Fragment contract
- Root: `<section class="part" id="<id>"><h2>Title</h2><p>intro</p> … </section>`. Use `h3` with ids `<prefix>-…` for subsections and `.comp` blocks for components.
- Use shell classes: `.tw > table.tbl`, `pre > code`, `.note(.warn|.bad)`, `.grid2`, `ul.chk`, `dl.kv`, `.tag`, `.specimen`, `.sw` color swatch (inline `style="background:var(--token)"` is allowed only on `.sw`).
- Plain, direct copy with short sentences. No em dashes, no exclamation marks.
- The page must work at 400px wide: tables and code scroll inside their `.tw`/`pre` wrapper, and never set a fixed width wider than 360px.
- **End with a coverage table**, exactly in this form, with one row for EVERY `###` and `####` heading in your assigned schema range, using the heading text verbatim (backticks removed):
```html
<h3 id="<prefix>-coverage">Coverage</h3>
<div class="tw"><table class="tbl cov"><thead><tr><th>Schema heading</th><th>Covered in</th></tr></thead><tbody>
<tr><td data-schema="ChatMessages">ChatMessages</td><td><a href="#sm-messages">Message</a></td></tr>
<tr><td data-schema="ProjectSidebar (exported, not mounted)">ProjectSidebar (exported, not mounted)</td><td>Out of scope: replaced by Sidebar projects group, see <a href="#nv-sidebar">Sidebar</a></td></tr>
</tbody></table></div>
```
  Second cell: either a link to your block, or "Out of scope: reason". Nothing may be skipped silently.
- Then add "New backend items" and "New decisions" tables if you have any.
- Length: as long as needed to be complete (expect 500-1100 lines). Completeness beats brevity.
- When done, reply in under 150 words: file written, number of components specified, coverage rows (covered vs out of scope), and every BE-NEW / D-NEW you added.

# Conversation v3 wireframe: fragment brief

You write ONE fragment of `design/convo-v3-wireframe.html`. `stitch.py` joins `shell.html` + fragments in this order:
map, nav, composer, stream, requests, agents, obs, states, system. Only write your own file `design/.cv3-parts/<name>.html`. Don't edit shell.html, stitch.py or other fragments.

## Read first
- `design/.cv3-parts/shell.html` lines 1-340: tokens, and shared classes (`.sec .sec-head .eyebrow .board .board-cap .wf .pin .notes .tag .tbl-wrap .q .pill .chip .bubble .msg .steps .mark .spinner .caret .composer .status-pill` and the icon sprite `<svg><use href="#i-name"/></svg>`: spark brain term file plug globe users shield key target list chart activity alert check x clock send stop steer slash chev chevd retry lock sidebar search plus bot user layers history sigma eye).
- The r2 fragment closest to yours in `design/.cv2r2-parts/` (map, stream, requests, chrome, panel, obs, gaps). Match its visual language and markup density; improve on it, don't copy it.
- `design/convo-v3-plan.html`: the approved plan. Section numbers (§) refer to `chat-ui-schema.md` in the repo root (grep it for details you need; don't read all 5,400 lines).

## Fragment contract
- Root: `<section class="sec" id="<name>">` with `.sec-head` (eyebrow in handwriting style, h2, one-paragraph p).
- Put your CSS in a `<style>` inside the section, every selector prefixed with your section's prefix (map `mp-`, nav `nv-`, composer `cp-`, stream `sm-`, requests `rq-`, agents `ag-`, obs `ob-`, states `ss-`, system `sy-`). Colors only from shell tokens (`var(--…)`), never literals, so both themes work. Anything new that needs a color uses color-mix on tokens.
- 2-4 `.board`s. Each board = a realistic mock on the left (`.wf` or your own frame) with numbered `.pin`s, and `<ol class="notes">` on the right. Each note is exactly: `<li><span class="pin">N</span><div><b>Name</b> <span class="tag …">…</span><span>What it is and why.</span></div></li>`.
- Tag every note with ONE data tag: `tag data` (data exists today), `tag derive` (client logic only) or `tag backend` (needs new field/endpoint; name it in the text). Add `tag new` when it's a component that doesn't exist yet. You may also add a placement tag (content/status/diag).
- Close with one `.tbl-wrap` table: Element · Source field or event · Data tag. Optional: up to 2 open questions as `<div class="q"><b>Question?</b><span>Context and recommendation.</span></div>`.
- Realistic content only. Scenario thread: a Qlik Analyst agent building "Onboarding plan for new analysts" from handbook docs, with helpers Atlas (research) and Juno (drafting), a Google Drive MCP server, and a 50k-token goal. No lorem ipsum.
- Must work at 400px wide: flex/grid wraps, `min-width:0` on text children, only tables/code scroll horizontally in their own container. Visible `:focus-visible`. No external resources, no scripts unless trivial and inline.
- Plain, direct copy. No em dashes, no exclamation marks.
- Target 250-450 lines. When done, reply in under 120 words: file written, boards drawn, anything you had to invent or leave out.

## Hard facts (do not contradict)
- Approval modes: Ask, Auto-allow read-only tools, Autopilot (Autopilot needs flag `autopilot=true`; picker hidden when `enabled=false`). Plans and secrets always ask.
- `/goal` takes a TOKEN budget only (1 to 10M, `k` suffix). One goal per conversation. Goal statuses include blocked, usageLimited, budgetLimited, contextWindow.
- Send sits beside Stop while running once the user types. Enter sends, Shift+Enter newline. Esc order: close slash/@ menu, then exit goal mode, then close popover/panel, then stop turn.
- Hotkeys mod+K, mod+B, mod+., mod+J are global and fire while typing.
- Requests: buttons come from `options[]` ({label, description} only; no "recommended" flag). Plan approval = Approve / Revise. On expiry a non-secret question continues with its first option; approvals and secret questions are declined. `PendingRequest` has no turnId or createdAt (backend ask).
- Helper `SubAgentStatus` has 7 values in 4 tones (include notFound). No per-helper tokens (backend). No "Limited access" status.
- Thinking has no duration. Show "Thought" + word count, or tag "Thought for Ns" as backend.
- Plans have no version/diff in the contract (plan history is client-kept; tag derive).
- Visualizations are a sandboxed iframe of model HTML, 160-900px tall, with loading, error and 12s timeout states.
- `TurnFailure.reason`: contextWindow → Compact; quota and credentials → fix copy, no Retry; show providerTip. Ref format `code · requestId`.
- Agent settings that exist: model and effort (none, minimal, low, medium, high, xhigh, ultra). No reasoningSummary, serviceTier, personality.
- Uploads: 1 MB per file, `uploadAccept` list. Agents: create only today (edit/delete = backend). MCP: http transport, edit/delete endpoints exist, live status + OAuth = backend, changes apply to new chats.
- Only the owner can write; read-only viewer is a new design. fetch/EventSource lack credentials (backend).
- Contrast: use `--ink-2` for text under 13px; buttons with white text use `--accent-fg` fill, not `--accent`.

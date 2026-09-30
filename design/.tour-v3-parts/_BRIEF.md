# truex App Tour v3: brief shared by every section agent

You write ONE fragment of design/app-tour-v3.html. `python3 stitch.py` (this folder) replaces `<!--PART:name-->` in
shell.html with `name.html`. Only write your own file. Do not edit shell.html, stitch.py, other fragments, or app.tsx.

## Sources (read what your section needs, skim the rest)
- ../convo-v3-wireframe.html: the new design. Fragments in ../.cv3-parts/ (nav, composer, stream, requests, agents,
  states, system). Copy their mock markup idiom and class names, so the tour mocks look like v3. Read ../.cv3-parts/BRIEF.md
  "Hard facts": they are binding here too.
- ../convo-v3-plan.html: the approved plan (P0-P3).
- ../agent-team-list-v2.html: the new agent team page ("Team Pins").
- ../app-tour.html and ../.tour-parts/*.html: the v1 tour. Same tour layer, same quality bar. Reuse its idioms, but every
  mock must now show the v3 UI.
- shell.html in this folder: tokens and classes. Tour layer classes are at the end of its <style>: .demo .tour-layer(.dim)
  .spot(.round .inset) .t-anchor .coach(.static .hero, data-side below/above/left/right/center, --caret) .c-eye .c-x
  .c-dots(i.done i.on) .c-foot .tb(.primary .soft .line .quiet) .c-try .c-wait .kbd .beacon .scribble .tour-chip .mring
  .tag.look/.try/.wait. v3 data tags: .tag.data .tag.derive .tag.backend, plus .tag.new.

## Scenario (real content only)
Nitin, a new analyst lead. Qlik Analyst (@qlikanalyst, built-in, gpt-5 · high, Google Drive MCP attached) builds
"Onboarding plan for new analysts" from handbook docs. Demo prompt: "Draft a 30-day onboarding plan for new analysts from
the handbook". Helpers: Atlas (research), Scout (nested, level 2, Qlik license tiers), Juno (drafting). Goal: 50k tokens,
2/4 steps, 42k/50k. Custom agent example: Research Scout @researchscout (gpt-5-mini · medium). New agent in the create
tour: Handbook Coach @handbookcoach, "Answers new analysts' handbook questions".

## v3 facts the tour must teach correctly
- Approval modes: Ask, Auto-allow read-only tools, Autopilot (needs flag; picker hidden when disabled). Plans and secrets always ask.
- Composer action bar: paperclip + file chips (1 MB each), agent chip (locks once the session starts), model and effort chip,
  approval mode picker, Goal. @ opens one mention picker for files, agents and tools (derive; tool list per session = backend).
- /goal takes a token budget only. Goal strip: progress first ("2/4 steps"), budget meter second, each stop has one fix.
- While a turn runs: Send sits beside Stop once the user types; typed messages queue as editable chips; Steer is separate; ↑ recalls.
- Esc order: close slash/@ menu, then goal mode, then popover/panel, then stop the turn. The tour's Esc handling must sit before
  this and only minimize the tour.
- Helpers: one "Handed off" node per hand-off; 7 SubAgentStatus values in 4 tones; no per-helper tokens (backend).
- Requests dock above the composer; buttons come from options[]; plan = Approve / Revise; expiry ring.
- Needs-you tray: one count for open requests, goal stops, failed helpers, tools needing sign-in; g then n jumps to the oldest.
- ⌘K searches chats, commands and agents. Global hotkeys mod+K, mod+B, mod+., mod+J fire while typing (the tour pauses them).
- Agents: create only today. Edit and delete need PATCH/DELETE /api/agents/:id (backend): mention as "later", never tour them.
  Handles: a-z and 0-9, max 20, unique; 409 AGENT_HANDLE_TAKEN. New agents get read-only sandbox and on-request approval,
  shown as locked facts. Fields: name 40, description 80, systemPrompt 20,000, look 12, tint 5, model.
- MCP: changes apply to new chats. Live status and sign-in are backend.
- Team page (Team Pins): polaroid cards, frame = tint dot, photo = tint bg, every card has a blue pin, the agent in the current chat
  gets a red pin and an "in chat" badge; header, search and All / Yours / Built-in filters stay.

## Tour structure (decided)
Main tour, 12 stops, 3 chapters:
- Ch1 First look (ch1.html, id first-look): 1 Welcome (centered hero card over the empty hero with agent starters) ·
  2 Sidebar and ⌘K · 3 Composer action bar · 4 Approval modes
- Ch2 See it work (ch2.html, id see-it-work): 5 @ mention picker (Try) · 6 Send the demo prompt (Try) ·
  7 Handed off node (Wait then Look) · 8 Request card above the composer (Try: answer it) · 9 Needs-you count and tray
- Ch3 Keep it going (ch3.html, id keep-going): 10 Queue and Steer · 11 Goal strip · 12 Finish (centered, replay from Account)
Agent tours: Team page, 4 stops (team.html, id team); Create agent, 5 stops (create.html, id create-agent).
Coach eyebrows: "Step 3 of 12 · First look", "Team · 2 of 4", "Create · 1 of 5". Dots count that tour's stops.
Missing target: 3s, then a centered card with the same copy. Keys: → / Enter next, ← back, Esc minimizes to the resume chip,
except on a finish card where Esc closes. Progress: localStorage `truex-tour` {v:3, done, step, parts:{team, create}}.

## Canonical data-tour names (use exactly)
Main: hero-starters, sidebar, palette, composer-bar, attach, agent-chip, model-chip, approval-mode, goal-chip, mention-picker,
send, handoff, request-card, needs-you, queue, goal-strip, tour-replay. Team: nav-agents, team-filters, team-card, new-agent.
Create: agent-name, agent-look, agent-model, agent-create, agent-celebrate.

## Fragment rules
- <section class="sec" id="YOUR-ID">, .sec-head (eyebrow, h2, one p). 2-5 `<div class="board">` (exact string). Each board: a
  .demo with a full v3 mock in that step's state, the real spotlight and coach, and <ol class="notes"> with notes exactly like
  `<li><span class="pin">N</span><div><b>Name</b> <span class="tag …">…</span><span>…</span></div></li>`.
- Tag every note with one of tag data / tag derive / tag backend, plus tag look/try/wait on the step note. Name the missing
  field or endpoint in backend notes.
- Spotlight: class t-anchor on the target and `<span class="spot inset" aria-hidden="true"></span>` as its last child (add
  `round` for pills). No ancestor between target and .demo may use transform, filter, opacity<1, backdrop-filter, z-index or
  overflow:hidden (except .app). Wrap elements with backdrop-filter (like the dock) in a div.t-anchor.
- Coach: direct child of .demo, placed with inline top/left/right/bottom near the target, never covering it. Under 640px it drops
  below the mock automatically.
- One scoped <style> at the top, every selector prefixed `#YOUR-ID`, tokens only (no literal hex outside a single clearly named
  token block if you truly need fixed colors).
- Works at 400px: wrap or stack, min-width:0 on text, no page scroll sideways. Sentence case, short plain copy, no em dashes,
  no exclamation marks, no emoji, no lorem. Valid HTML, double-quoted attributes. prefers-reduced-motion respected.

## How to write (important)
Earlier agents died when one long write took over 90 seconds. Your first file write must happen within your first few tool
calls: Write a short skeleton (section open tag, scoped style, sec-head). Then append ONE board per tool call with Bash
(cat >> file <<'EOF' ... EOF), each under about 120 lines, then append </section>. Never emit the whole file at once.
Finish with `python3 stitch.py` (missing parts from others are expected) and an html.parser tag-balance check.
Report back in 5 lines or fewer: file, boards, pins, anything invented or deviating.

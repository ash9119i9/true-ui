# truex App Tour: design board brief (shared by every section agent)

You are writing ONE HTML fragment for design/app-tour.html, a pinboard-style design review page for a
guided in-app tour of truex. `python3 stitch.py` in this folder replaces `<!--PART:name-->` in shell.html
with `name.html`. Do not edit shell.html, _tour.css, _head.html or stitch.py. Only write your own file.

## The product (real content only, never lorem ipsum)
truex is a chat workspace for AI agents. The user (demo name: Nitin) talks to a named agent (built-ins:
Qlik Analyst @qlik, Researcher, Writer, Ops). The agent spawns parallel helpers: Atlas (Docs, tone-0 blue),
Birch (Access, tone-1 green, shows a limited-access warning), Cedar (Shadowing, tone-2 orange). A right
"Session activity" panel has tabs Activity, Agents, Goal, Plan, Insights (Insights = time, tokens, context
meter of 258k). Width 360 or 560. Left sidebar: Search ⌘K, New conversation ⌘J, conversation list, Agents
link (opens roster "Meet the team", polaroid cards with a pushpin on the agent in the current chat,
filters All / Yours / Built-in, a "New agent" card). Floating dock, in order: Sidebar ⌘B, Search ⌘K,
New chat ⌘J | Agent | Activity ⌘. | Account. Composer: Enter sends, Shift+Enter newline, a goal chip turns
on goal mode (budget select, Pause/Resume/End, goal strip, Esc leaves goal mode). Topbar: crumb title,
status pill (current agent + state Starting/Working with pulse; click to edit agent), theme toggle.
Creating an agent: 12 robot looks, 5 tints (ice #BCDEE8, mint #A9D5BE, butter #EBCB8B, lilac #C4BDE3,
peach #F0B999, exposed as --ice --mint --butter --lilac --peach), lanyard badge, confetti, "{name} is on the
team", Say hi / Done. Demo prompt for the tour: "Draft a 2-week onboarding plan for new analysts from the handbook".
NOT built yet, keep out of the tour (mention only as "later"): MCP tools, Files viewer, team board redesign,
conversation v2, the Settings link.

## The tour (decided design; recommended defaults)
Custom React component in app.tsx (TourLayer + useTour), no library. Anchors are `data-tour="…"` attributes.
Each step: target, prepare() (puts app in state), optional waitFor, optional advanceOn. Missing target after
3s -> centered card. Progress in localStorage key `truex-tour` {v, done, step}. Auto-starts on first visit,
replay from Account menu "Take the tour". Three chapters:
- Chapter 1 First look: 1 Welcome (centered hero card, Start tour / Not now) · 2 Composer (Look) ·
  3 Status pill (Look) · 4 Dock + shortcuts (Look)
- Chapter 2 See it work: 5 Agent popover (Try: pick an agent) · 6 Send the demo prompt (Try, advances on send)
  · 7 Helper card (Wait until helpers spawn, then Look) · 8 Session panel, Agents tab (Look; copy must say
  this tab lists helpers in this chat, while the sidebar Agents link opens all your agents)
- Chapter 3 Make it yours: 9 Goal chip (Look) · 10 Roster + New agent (Look) · 11 Finish (centered card,
  "Replay any time from Account", Done)
Step tags: Look (read + Next), Try (user performs action, Next disabled or "Skip this"), Wait (tour waits for app).
Keys during tour: → / Enter next, ← back, Esc closes (goes to minimized resume chip). App hotkeys paused.

## Page system (read these before writing)
- CSS for everything: ./shell.html (inside <style>): tokens, .sec/.sec-head/.board/.board-cap/.notes/.pin/.pin-at,
  mock parts .app .app-chrome .app-body .app-stage .app-panel .panel-head .panel-body .wf-top .crumb
  .status-pill .pulse .tabs .tab .msg .bubble .steps .hcard .hcard-head .hrow .h-av(.tone-0/1/2 via --t/--ts)
  .answer .bottom .composer .composer-bar .send .dock .pop .it .chip .pill .btn .card .tile .kpis .stats .ring
  .callout .tbl-wrap table .steps-list .qs .q .tag(.exists .changed .new) and more. The tour layer classes are at
  the end: .demo .tour-layer(.dim) .spot(.round .inset) .t-anchor .coach(.static .hero, data-side
  below/above/left/right/center, --caret) .c-eye .c-x .c-dots(i.done i.on) .c-foot .tb(.primary .soft .line .quiet)
  .c-try .c-wait .kbd .beacon .scribble .tour-chip .mring .tag.look/.try/.wait
- Markup examples to copy the idiom from: ../.cv2r2-parts/map.html and ../.cv2r2-parts/panel.html (skim).
- Icons: `<svg class="ic"><use href="#i-bot"/></svg>` (symbols: spark brain term file plug globe users shield key
  target list chart activity alert check x clock send stop steer slash chev chevd retry lock sidebar search plus
  bot user layers history sigma eye). Check .ic in shell.html for sizing.

## Fragment structure
<section class="sec" id="YOUR-ID">
  <div class="sec-head"><span class="eyebrow">handwritten kicker</span><h2>…</h2><p>…</p></div>
  <div class="board">                      <- EXACT string, the stitcher counts it
    <div> <div class="demo" role="img" aria-label="…"> <div class="app">…mock…</div> …coach… </div>
          <p class="board-cap">handwritten caption</p> </div>
    <ol class="notes"><li><span class="pin">1</span><div><b>Title</b>text <span class="tag new">New</span><span class="src">source</span></div></li>…</ol>
  </div>
</section>
Pins: `<li><span class="pin">N</span>` exactly (counted). Matching `.pin.pin-at` markers can sit on the mock.

## Spotlight + coach rules (so it works at every width)
- Spotlight: add class `t-anchor` to the target element and put `<span class="spot inset" aria-hidden="true"></span>`
  as its last child (add `round` for pills). Its giant box-shadow is the scrim; the hole follows the target at any width.
  No ancestor between target and .demo may have transform, opacity<1, filter, backdrop-filter, z-index, or
  overflow:hidden (except .app, which is fine). .dock has backdrop-filter: wrap it in a `<div class="t-anchor">`
  and put the spot in the wrapper instead.
- Coach: a direct child of .demo, positioned with inline top/left/right/bottom in px from the demo edges near the
  target, with data-side and --caret pointing at it. Under 640px it becomes static below the mock automatically.
  Centered steps: `<div class="tour-layer dim"></div>` + coach data-side="center" centered with inline style.
- Coach content order: .c-eye (e.g. "Step 3 of 11 · First look" + .c-x close), h4 (may use one <em> in Newsreader
  italic), p (1-2 short sentences), optional .c-try / .c-wait, .c-foot (.c-dots with 11 dots, Back / Next).
- Give each mock a realistic, dense, believable state (real conversation titles, timers, token counts).

## Craft rules
- Aesthetic bar is very high: precise alignment, consistent padding, pinboard charm (tape, sticky notes, Caveat
  scribbles with a hand-drawn arrow, slight rotations on notes) but the mocks themselves are crisp and exact.
- Colors: tokens only (var(--…)). No literal hex anywhere except inside tokens. Must look right in light and dark.
- If you need extra CSS, add ONE <style> at the top of your fragment, every selector prefixed with `#YOUR-ID`,
  tokens only. Keep it small. Respect prefers-reduced-motion.
- Phone width ~400px must not scroll horizontally; wide tables inside .tbl-wrap.
- Copy: sentence case, short, plain, active voice. No em dashes, no exclamation marks, no emoji, no lorem.
- Valid HTML: close every element, double-quoted attributes.
- When done: run `python3 stitch.py` (missing-part errors for other sections are expected) and a quick tag-balance
  check of your fragment with Python's html.parser. Report back in <=5 lines: file written, boards, pins, anything odd.

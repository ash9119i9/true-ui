# Addendum: the three agent tours (read _BRIEF.md first, this adds to it)

The main tour stops at step 10 on the roster. Three short tours cover agents in depth. Each runs on its own, the first
time the user reaches that screen, and each has its own progress (dots count that tour's stops only).
Storage: `truex-tour` gains `parts: {find:boolean, create:boolean, edit:boolean}`. Esc minimizes the same way.
Replay: Account menu "Take the tour" opens a small chooser: Full tour / Finding agents / Creating an agent / Editing an agent.

| Tour | Trigger | Stops (eyebrow text) |
|---|---|---|
| Find (section id find-agents, eyebrow "Agent tour 1") | first visit to the roster, or "Show me around" on main step 10 | Find · 1 of 3 Sidebar Agents link · 2 of 3 Filters and search · 3 of 3 A polaroid card |
| Create (id create-agent, "Agent tour 2") | first time the New agent dialog opens | Create · 1 of 5 Name and handle · 2 of 5 Look and tint · 3 of 5 Model, servers, skills · 4 of 5 Live badge · 5 of 5 Create and celebrate |
| Edit (id edit-agent, "Agent tour 3") | first time an edit dialog opens | Edit · 1 of 3 Three ways in · 2 of 3 Built-in lock · 3 of 3 Save, saved, remove |

## Real app facts (app.tsx; use this copy, do not invent other copy for app UI)
- Sidebar "Agents" link `.side-nav .side-link` (Sidebar ~399). AgentMenu also has "All agents" (~626).
- Roster (AgentsView ~1222): crumb "truex / agents", title "Meet the team:" with a Caveat "truex style" flourish, search
  `.roster-search` placeholder "Search by name, handle or purpose" (~1244), filter pills `.bp-pills` All / Yours / Built-in
  (~1248), polaroid cards `.pol-card` with tint `--tint`, tilt `--tilt`, a "built-in" lock note on built-ins (~1270), a
  Pushpin + "in chat" on the agent in the current chat (~1272), clicking the photo `.pol-photo` edits the agent (~1273),
  a "Chatting" state, "Edit" and a Chat button, and a "New agent" card `.pol-new` last (~1297). Empty search: "Clear search".
- Built-ins: Qlik Analyst @qlik "Dashboards, metrics, BI queries" (look Listener, tint Ice); Researcher @research
  "Web research with citations" (Scout, Mint); Writer @writer "Docs, release notes, briefs" (Antenna, Butter);
  Ops @ops "Runbooks, tickets, on-call" (Builder, Lilac).
- AgentDialog (~1032) is a centered dialog `.scrim.center > .agent-dialog`, 20px radius, form on the left and a badge
  stage `.nad-stage` on the right showing a live lanyard Badge (~880) you can drag. Title id `nad-title`: "New agent".
  Fields in order: Name (placeholder "Research Scout", handle shown as @research-scout, derived by slug; if taken the
  handle shows as taken and Create is disabled), Purpose (placeholder "What this specialist owns"), Instructions
  (placeholder "Standing instructions injected into every one of its turns"), Look (12 radios: Graphite, Antenna, Navy,
  Listener, Scout, Chef, Builder, Scarf, Mint, Lilac, Peach, Captain), Tint (Ice, Mint, Butter, Peach, Lilac), Model
  (Claude Opus 5.5, Claude Sonnet 5.5, Claude Haiku 4.5), MCP servers and Skills multi-pickers (empty states "No servers. It
  can only use its own knowledge and skills." and "No skills yet."). Catalog of servers and skills: /tmp/agents-catalog.txt.
  Primary button "Create agent".
- Success (~1078): no card. A dark scrim, the badge drops from the top of the viewport on its lanyard with a springy
  overshoot, confetti, then copy "{name} is on the team" and "Mention @handle anywhere to wake it. Drag the badge around
  while you're here." Buttons "Say hi to {name}" (primary, autofocus) and "Done". Say hi starts a new chat with the
  composer prefilled "@handle hi, ".
- Edit: three ways in: the topbar status pill, the pencil `.menu-edit` in AgentMenu (visible on row hover or focus,
  aria-label "Edit {name}"), and clicking a polaroid photo. Built-in agents: Name, Purpose, Look and Tint are disabled with a
  small lock hint "built-in"; intro copy "A built-in specialist. Tune its instructions, model, servers and skills; its
  name and look stay fixed." Instructions, Model, servers, skills stay editable. The badge shows a "built-in" tag.
  Button "Save changes"; after save it reads "Saved" with a check and a shine sweeps across the badge. Custom agents
  also get "Remove agent", which turns into "Confirm removal" with Keep / Remove. Built-ins cannot be removed.

## New hooks (use exactly)
nav-agents (exists), roster-filters (search + pills wrapper), roster-card (the first polaroid, Qlik Analyst, in chat),
new-agent (exists), agent-name, agent-look (look + tint group), agent-tools (model + servers + skills group),
agent-badge (the .nad-stage), agent-create (Create agent button), agent-celebrate (celebration copy block),
agent-edit (the .menu-edit pencil), agent-lock (the locked Name field of a built-in), agent-save (Save changes button).

## Craft notes for these sections
- Build a real, dense AgentDialog mock: two columns, left form with labeled fields, right a badge stage with a CSS or
  inline-SVG robot on a lanyard in the selected tint. Draw robots with simple shapes; keep SVG paths short.
- The dialog sits over a scrim inside the mock. The tour spotlight must sit above the dialog (its hole cuts the tour
  scrim, the dialog scrim stays underneath). Nest .t-anchor + .spot on the dialog field as usual.
- The celebration is dark in both themes. Give it scoped tokens in one `#section-id .celebrate-mock{…}` block
  (literal values allowed only there), static at rest, drop animation once, nothing under reduced motion.
- Coach eyebrows use the tour text from the table, e.g. "Create · 2 of 5". Dots count that tour only.
- Each section: 1 board per stop, plus a first small "Trigger" note list inside the first board's notes explaining when
  that tour starts and how it hands off (Find ends by pointing at New agent; Create ends on Say hi; Edit ends on Save).

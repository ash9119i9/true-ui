# Agent onboarding prototype: fragment brief

We are prototyping "onboarding" for truex: creating an agent together with its Skills and MCP access, on the existing lanyard-badge metaphor. Three agents each write ONE page. Write only your own file. Everything else in the repo is read-only.

## The metaphor (fixed)
- Agent = ID badge on a lanyard (exists: `agent-badge-standalone.md`, `agent-created-standalone.md`, `Badge` in `app.tsx` ~line 880).
- Skill = training pin pinned on the strap. How the agent does something. Portable, versioned. States: draft (outline pin), tested (filled), published (enamel shine), new version (small "v2" dot), locked (needs a key it doesn't hold).
- MCP = keycard clipped to a key ring beside the badge. What the agent can reach. Scoped, revocable, can expire, shared workspace resource. Card shows service mono color, scopes in print ("read · issues, PRs"), tool count, status LED. States: cutting, live, expired ("Sign in again"), revoked, shadowed, needs sign-in (dashed).
- A skill can declare `requires: ["github"]`. If the agent lacks that key, its pin shows a lock and copy "Grant GitHub access to unlock Release notes".
- Badge footer changes from "2 mcp · 3 skills" to "2 keys · 3 pins"; red if anything is locked/expired.

## Data to reuse (from app.tsx lines 78-101)
MCP_SERVERS: qlik Qlik Sense (14 tools, #3691CD), github GitHub (22, #1F2A30), linear Linear (11, #5E6AD2), jira Jira (12, #2A72A3), notion Notion (9, #5F6D73), slack Slack (8, #8C4A86), sentry Sentry (7, #6B4FA0), postgres Postgres (4, #33658A), figma Figma (Not connected, #C0563F).
SKILLS: research Web research, charts Chart builder, sql SQL analyst, files PDF & files, sheets Spreadsheets (built-in); docs Doc writer, release Release notes, runbook Runbooks (workspace).
Proposed requires (prototype only): release -> github, runbook -> sentry + slack, sql -> postgres, charts -> qlik (optional).

## Visual rules
- Copy the tokens `:root` block, dark-mode blocks, fonts (Figtree, Newsreader, JetBrains Mono, Caveat), and the Robot/Badge/Clip/Confetti code verbatim from `agent-badge-standalone.md` (its ```html block). Extend, don't restyle.
- React 18 + Babel from unpkg, same as the standalone pages. No build step. Must open straight from disk.
- Colors only via tokens (service mono colors are data, allowed inline).
- Works at 400px wide, no horizontal scroll. Honors prefers-reduced-motion. Dark mode via system or `data-theme`.
- Copy: short, plain sentences. No em dashes, no exclamation marks.
- Add a small top-right toggle for light/dark and a "Replay" where there is animation.
- Keep the badge draggable with its physics; pins and keycards should ride along with the lanyard (keycards may lag/swing slightly).

## Pages
1. `design/agent-onboarding-dialog.html`: the 3-step "New agent" onboarding dialog (Identity -> Training -> Access), live badge preview assembling on the right, skill-driven access prefill, inline "cut a key" mini flow, locked pins, finale ("Aria is on the team. Trained in 3 skills, access to 2 systems.").
2. `design/agent-onboarding-library.html`: standalone creation of a Skill ("press a pin": name, when-to-use trigger, instructions, requires, test run, publish) and an MCP key ("cut a key": pick service, sign in, scopes, name; slide-into-reader success), plus the workspace Key cabinet and Pin board library views with "Used by N teammates" and update-all / fork choice.
3. `design/agent-onboarding-chat.html`: the chat-driven path. User types intent ("Make an agent that triages Sentry errors and posts to Slack"); stream shows an onboarding draft card (compact + expanded) with badge, pins, dashed keycards needing sign-in, scope review, approve; then stream lines ("Aria learned Release notes v2", "Aria was given GitHub (read)", "Aria's Slack key expired. Sign in again") and edge states (expired, version bump, MCP removed). Match the stream/composer look in `design/.cv3-parts/stream.html` and `composer.html`.

When done, reply in under 120 words: file written, what's interactive, anything you couldn't do.

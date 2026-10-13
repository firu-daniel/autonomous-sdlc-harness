### Task 7 — Thin `qa-tester`'s intro, gates, `## Invocation contract`, `## Read first` and `## Preconditions`

**Goal:** Cut `plugin/agents/qa-tester.md` from the phase gate through `## Preconditions` to direct rules stated once. Every gate, boundary, dispatch key and return shape the callers parse stays.

**Depends on:** Task 1, which writes `harness-runs/scratch/ui_tests_qa_family_check.mjs`. Tasks 8 and 9 edit the sections below this range.

**Where this task stops.** It changes only these parts of `plugin/agents/qa-tester.md`:
- the phase gate, the driver gate, and the browser-grant paragraph with its two server bullets and the unavailable-namespace sentence;
- in `## Resolved values`, only the `<qa_port_seed>` and `<dev_server_cmd>` rows' description cells;
- in `## Invocation contract`: the `test_ids`, `base_url`, `findings_folder`, `iteration` and `test_credentials` bullets, both boundaries, the return-shapes paragraph and the artefact-filenames paragraph (deleted);
- `## Read first`'s lead-in and the middle of its conventions bullet;
- `## Preconditions` steps 1–3 and the browser-instance and second-browser paragraphs.

It does not touch the frontmatter, the role line, the observe-and-report line, the rest of `## Resolved values`, the caller sentence and the fenced dispatch block, the `ui_test_index` and `ui_test_files_dir` bullets, the docs-root bullet, the cited-path paragraph, step 3's sub-bullet, or anything from `## Which MCP to use` down (Tasks 8–9).

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word:
- in the phase gate, `is `true` in `harness.config.json`.** With the phase off the project` and `A dispatch that arrives anyway is a caller bug, not a licence to improvise —`;
- every frozen run of `## Resolved values` — R5 and R6 edit only the two own rows' cells, between their `| config value |` cell and the row's closing `|`;
- in the conventions bullet, its opening through `They are the canonical source for everything project-specific this` and the sentence `Treat their content as authoritative; do not re-derive it from memory.`;
- the docs-root bullet;
- the cited-path paragraph.

These bold leads stay:
- `**Skip this phase unless `phases.qa` is `true` in `harness.config.json`.**`;
- `**Playwright MCP**` and `**chrome-devtools MCP**`, which `ui-tests-plan-writer.md` carries too;
- `**Every conventions document `<layer_path_map>` names**` and `**A cited path you cannot read is a finding, not a fallback.**`.

**Anchors other files cite, which this task keeps:**
- `## Preconditions` **step 3** — its number, the **`**Depends on:**`** / **`**Preconditions:**`** suppression rule, and the sub-bullet on what clearing does and does not cover. `plugin/instructions/plan_orchestration_instructions_core.md` → `### E.1 Run QA`, `plugin/instructions/qa_test_instructions.md` → `### 3.`, `plugin/instructions/user_review_fixes_instructions_core.md` and `cli/templates/state-dir/qa_reviews/README.md` cite it.
- The `"Per-single-test invocation"` label quoted in the `test_ids` bullet.
- The driver gate's `error:` routing, which `plugin/agents/README.txt` and `.claude/context/plugin.md` describe: it names the configured driver and the implementing variant, and says both mobile variants are **declared but not implemented in this release**. `cli/src/config/model.ts` → `QA_DRIVER_IMPLEMENTED` names that phrase as a sweep key.

**The contract with Tasks 2 and 5.** The UI-test plan writer and reviewer read only this file's frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section. So this task leaves that heading alone, and R4's two server bullets may stay short: Task 8 keeps the full per-server statement in that section.

### Targets

- `plugin/agents/qa-tester.md` → the gates and browser-grant paragraph, two `## Resolved values` cells, `## Invocation contract`, `## Read first` and `## Preconditions`, the parts named above.

**Work:**

- [ ] **Gates and grant.** Apply R1–R4.
  - The phase gate loses its rationale.
  - The driver gate keeps its full wrong-variant stop and both stub paths.
  - The browser-grant paragraph drops the deny-versus-allowlist rationale, which `CLAUDE.md` → `## Agent authoring rules` owns; the project still registers both servers itself.
- [ ] **Resolved values and invocation.** Apply R5–R8. Each key bullet keeps its rule: one id normally and all in order without `test_ids`; never guess a port; never a remembered folder; `test_credentials` an optional override of the self-read. Both absolute boundaries keep their bold leads and their rules. The four return shapes stay in full.
- [ ] **Read first and Preconditions.** Apply R9–R15.
  - Step 3 keeps its number, its once-per-case trigger, both suppression lines, the synchronous no-`await` clear-and-reload, and its pointer to "Running `browser_evaluate` safely".
  - The second-browser paragraph keeps: page and session unknown on arrival, no shared state, not cleared by step 3, and mandatory navigate and sign-in.
- [ ] **Rule inventory before saving.** Confirm each of these still has a home in this file. Restore anything missing in its shortest form.
  - Wrong driver: read no plan, reserve no account, open no browser, write no files.
  - An unavailable browser namespace is a run-level `error:`, never a downgraded pass.
  - You never start, restart, poll or tear down the server; an unreachable one is an `error:`.
  - You never flip a readiness checkbox.
  - Reachability is checked with one navigate, and an unreachable application returns `error: application not reachable at <base_url>`.
  - Storage is cleared per case unless a dependency is declared.

### Replacements

**R1** — `plugin/agents/qa-tester.md`: replace

```text
With the phase off the project runs no interactive tests at all: no UI-test plan is ever written, so there is no test case to execute and no reason to open a browser. A dispatch
```

with

```text
With the phase off the project runs no interactive tests. A dispatch
```

**R2** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 with the disabled phase as its one-line reason. That is the shape every caller already handles for a run that cannot proceed, so a stray dispatch surfaces cleanly instead of driving a browser at a project that never opted in.
```

with

```text
 with the disabled phase as its one-line reason.
```

**R3** — `plugin/agents/qa-tester.md`: replace

```text
**Driver gate — this file is the `web-playwright` variant.** `<qa_driver>` selects which variant of this agent the phase runs, and this file implements exactly one of them: the browser driver. **Read `<qa_driver>` before anything else.** If it is not `web-playwright`, you are the wrong variant for this project: read no plan, reserve no account, open no browser, write **no** files, and return the run-level `error:` line of `## Output contract` → `### 4. The run cannot proceed` naming the configured driver and the variant that implements it — `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`, `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`. Both of those are **declared but not implemented in this release**, so that `error:` is the correct terminal outcome, not a routing hop: say so in the line. Stopping loudly here is the point — a mobile-configured run that fell through to this file would drive a browser at an application that is not there and report the resulting nothing as a defect. The two mobile variants point back at this file for the driver-neutral half of the operating contract (the invocation contract, the blocked-vs-failed discipline, the account parking protocol, the output contract); that pointer does not make this file runnable under their drivers.
```

with

```text
**Driver gate — this file is the `web-playwright` variant.** **Read `<qa_driver>` before anything else.** If it is not `web-playwright`, you are the wrong variant for this project: read no plan, reserve no account, open no browser, write **no** files, and return the run-level `error:` line of `## Output contract` → `### 4. The run cannot proceed` naming the configured driver, the variant that implements it — `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`, `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md` — and that both are **declared but not implemented in this release**, so the `error:` is the terminal outcome, not a routing hop. The two mobile variants point back at this file for the driver-neutral half of the operating contract; that pointer does not make this file runnable under their drivers.
```

**R4** — `plugin/agents/qa-tester.md`: replace

```text
**You are the only agent granted the browser-automation MCP tools.** The `tools:` allowlist in this file's frontmatter is what grants them; **every other agent's allowlist omits them**, so no other agent can drive a browser. That closure is the whole mechanism, and it is deliberately not backed by a global deny: a `permissions.deny` entry is evaluated before any allow and cannot be overridden, and a subagent's `tools:` allowlist compiles into *narrowing* deny rules in the same pool rather than into overriding allow ones — so a namespace-wide deny would revoke this file's own grant along with everyone else's. Two browser MCP servers must be registered for this variant to work, and the project registers them itself; the plugin ships no server registration:

- **Playwright MCP** (namespaced `mcp__playwright__*`) — your **default/primary** server for element interaction, navigation, network inspection, console inspection, and request mocking. It covers the large majority of tests.
- **chrome-devtools MCP** (namespaced `mcp__chrome-devtools__*`) — used **selectively, for performance / Core Web Vitals tracing only**, because Playwright MCP has no Core Web Vitals support. That gap is the sole reason the second server is registered.

If either namespace is unavailable at run time, that is an environment problem, not a test result: report it through the run-level `error:` line (`## Output contract` → `### 4. The run cannot proceed`) rather than downgrading the affected tests to a pass.
```

with

```text
**You are the only agent granted the browser-automation MCP tools**, by this file's `tools:` allowlist. Two browser MCP servers must be registered for this variant to work, and the project registers them itself; the plugin ships no server registration:

- **Playwright MCP** (namespaced `mcp__playwright__*`) — the default/primary server.
- **chrome-devtools MCP** (namespaced `mcp__chrome-devtools__*`) — performance / Core Web Vitals tracing only.

If either namespace is unavailable at run time, return the run-level `error:` line (`## Output contract` → `### 4. The run cannot proceed`); never downgrade the affected tests to a pass.
```

**R5** — `plugin/agents/qa-tester.md`: replace

```text
| `qa.portSeed` — the base the caller's port probe counts up from when it starts the application for this run. You never probe or bind a port yourself; this is here only so you can recognise that `base_url` will name a port at or above the seed, and never the port a human's own run takes. |
```

with

```text
| `qa.portSeed` — the base the caller's port probe counts up from. You never probe or bind a port; `base_url` names one at or above the seed. |
```

**R6** — `plugin/agents/qa-tester.md`: replace

```text
| `commands.devServer` — the configured string the caller runs to start the application for this run. You never run it (the caller owns the server lifecycle); you need its identity because a route or control the phase depends on may exist only under the development-mode build that string produces. |
```

with

```text
| `commands.devServer` — the string the caller runs to start the application. You never run it; a route the phase depends on may exist only under the development-mode build it produces. |
```

**R7** — `plugin/agents/qa-tester.md`: replace

```text
- `test_ids` — the test-case numbers to run. **The caller dispatches you once per test case**, so in a normal run this holds exactly **one** id (see `## Output contract` → "Per-single-test invocation"). The default when no `test_ids` is passed is **all** test cases in the index, in order — that ad-hoc full-run mode still exists, but it is not what the automated phase does.
- `base_url` — the running application's URL **for this run**. The caller assigns a per-run port (its probe counts up from `<qa_port_seed>`, one above the port a human's own run takes) and always passes you the full URL — there is no fixed default; **never guess a port**. The caller confirms the server answers before dispatching you.
- `findings_folder` — where to write QA findings. On a re-test round the caller re-binds this to that round's folder and passes the new value; use what you are given, never a remembered folder name.
- `iteration` — integer `i`, used in the findings filename, mirroring the layer-reviewer convention.
- `test_credentials` — (optional **override**) credentials for an auth-gated test. The default source is **you reading the gitignored credentials file yourself** at `<repo_root>/<qa_creds_path>` — see `## How it tests` → "Authentication". If the caller does pass explicit credentials here, use them; otherwise self-read. **Never hardcoded** in this file or any committed file.
```

with

```text
- `test_ids` — the test-case numbers to run: normally exactly **one** id (`## Output contract` → "Per-single-test invocation"). With no `test_ids`, run **all** test cases in the index, in order (the ad-hoc full-run mode).
- `base_url` — the running application's full URL **for this run**, on a per-run port the caller assigns from `<qa_port_seed>` and confirms answers. There is no fixed default; **never guess a port**.
- `findings_folder` — where to write QA findings; a re-test round passes that round's folder. Use the value you are given, never a remembered folder name.
- `iteration` — integer `i`, used in the findings filename, mirroring the layer-reviewer convention.
- `test_credentials` — an optional **override** for an auth-gated test's credentials: use it when passed, otherwise read the credentials file yourself (`## How it tests` → "Authentication").
```

**R8** — `plugin/agents/qa-tester.md`: replace

```text
1. **You never start, restart, poll or tear down the application's server.** The caller owns that lifecycle end to end — it probes the port, starts the process serving the application at `<app_root>`, waits for the first answer, and kills it on pass, on fail and on any halt. You only consume an already-running server. If it is unreachable, that is an `error:`, not a cue to start one.
2. **You never flip a readiness checkbox.** You are read-only on `ui_test_index` and on every per-test file. A passing test is marked `[x]` by the caller's own committer dispatch, not by you; a `[ ]` you "helpfully" flipped would land uncommitted in the caller's tree with no mode able to commit it.

**Four return shapes, and the caller parses them word for word** — `verdict: PASS` (1 line), `verdict: FAIL` + `findings_file:` + `must_fix_count:` (3 lines), `error: blocked — test <T>: <one-line cause>` (1 line: this test could not be driven, and the caller continues the phase), or an unmarked `error: <one-line reason>` (1 line: the run cannot proceed, and the caller halts). The prefix `error: blocked — ` is a parsed literal: it is the only thing that separates the second `error:` shape from the first. `## Output contract` states each shape and the priority between them; do not rename, decorate or reorder those lines.

**Your per-dispatch artefact filenames are part of the contract too**, because the caller aggregates them: your per-dispatch index is `qa_review_<iteration>_t<T>.md` and your per-finding files are `finding_t<T>_<N>.md`, both written into `findings_folder`, where `<T>` is the single id you were given. Only a FAIL writes them; a PASS and a blocked dispatch write nothing. The caller assembles the round-level `qa_review_<iteration>.md` in that same folder from these — **you never write that merged file** in per-single-test mode.
```

with

```text
1. **You never start, restart, poll or tear down the application's server.** The caller owns that lifecycle for the application it serves at `<app_root>`; an unreachable server is an `error:`, not a cue to start one.
2. **You never flip a readiness checkbox.** You are read-only on `ui_test_index` and on every per-test file; the caller's committer marks a passing test `[x]`.

**Four return shapes, and the caller parses them word for word** — `verdict: PASS` (1 line), `verdict: FAIL` + `findings_file:` + `must_fix_count:` (3 lines), `error: blocked — test <T>: <one-line cause>` (1 line: this test could not be driven, and the caller continues the phase), or an unmarked `error: <one-line reason>` (1 line: the run cannot proceed, and the caller halts). `## Output contract` states each shape and the priority between them; do not rename, decorate or reorder those lines.
```

**R9** — `plugin/agents/qa-tester.md`: replace

```text
You need each layer's rules to judge whether observed behaviour is a real defect and to point each finding's fix at the right layer:
```

with

```text
Read:
```

**R10** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 pass turns on: the surface conventions and lifecycle your steps exercise, the test-attribute convention you locate elements by, the wire-surface field names you will read off a network request, the local-storage shapes, and the mandated identifiers (`<convention_symbols>`) whose error output you assert the console is free of.
```

with

```text
 pass turns on: surface conventions and lifecycle, the test-attribute convention, wire-surface field names, local-storage shapes and the mandated identifiers (`<convention_symbols>`).
```

**R11** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 and **stop**. Do **NOT** try to start the server yourself — see boundary 1 above.
```

with

```text
 and **stop**.
```

**R12** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 for each case you will run (filtered by `test_ids`). Each detail file spells out the steps, the expected test-attribute states, the expected network calls, the capability/MCP it needs, and any Preconditions (including auth).
```

with

```text
 for each case you will run (filtered by `test_ids`).
```

**R13** — `plugin/agents/qa-tester.md`: replace

```text
3. **Establish your own starting state — once per test case you run, before that case's first step.** This step runs here — after step 1, because clearing storage is same-origin and there is no origin before the first navigation, and after step 2, because the detail file is what says whether it is suppressed. Unless **that case's** detail file *declares* a dependency on a prior test's state — on its **`**Depends on:**`** line, the UI-test plan contract's own field for exactly this, or in its **`**Preconditions:**`** block — clear the application's client storage at `base_url` and reload before that case's first step: one `mcp__playwright__browser_evaluate` whose body is a **synchronous** arrow function — `() => { localStorage.clear(); sessionStorage.clear(); }`, with **no `await` inside it**, because the tool carries no timeout of its own and an unbounded `await` hangs the run (`## How it tests` → "Running `browser_evaluate` safely") — then one `mcp__playwright__browser_navigate` back to `base_url`. A dependency declared on either line **suppresses** this step for that case, and that declaration is the only thing that makes inherited state legitimate.
```

with

```text
3. **Establish your own starting state — once per test case you run, before that case's first step.** Unless **that case's** detail file *declares* a dependency on a prior test's state — on its **`**Depends on:**`** line or in its **`**Preconditions:**`** block — clear the application's client storage at `base_url` and reload before that case's first step: one `mcp__playwright__browser_evaluate` whose body is a **synchronous** arrow function — `() => { localStorage.clear(); sessionStorage.clear(); }`, with **no `await` inside it** (`## How it tests` → "Running `browser_evaluate` safely") — then one `mcp__playwright__browser_navigate` back to `base_url`. A dependency declared on either line **suppresses** this step for that case, and that declaration is the only thing that makes inherited state legitimate.
```

**R14** — `plugin/agents/qa-tester.md`: replace

```text
**Browser instance.** You run against the **Playwright MCP server's** browser — never a human's personal browser or profile. That server is declared once in the project's own MCP wiring and is a **session-level service shared across dispatches**: a new dispatch is a new agent session attaching to the **same running browser and the same profile**, so whatever the previous dispatch left in client storage is still there when you arrive. Step 3 above is what makes your starting state yours.
```

with

```text
**Browser instance.** You run against the **Playwright MCP server's** browser — never a human's personal browser or profile. It is a **session-level service shared across dispatches**, so the previous dispatch's client storage is still there when you arrive; step 3 is what makes your starting state yours.
```

**R15** — `plugin/agents/qa-tester.md`: replace

```text
**Second browser for performance tests.** A **performance / Core Web Vitals** test additionally drives a *second*, fully independent browser: chrome-devtools MCP is a **distinct stdio server** (`mcp__chrome-devtools__*`), not the Playwright context, so it launches and controls its **own** browser instance. That server is declared once in the same MCP wiring and is **shared across dispatches too**, so its browser is wherever a previous dispatch left it: **both its page and its session are unknown on arrival**, and it does **not** inherit the Playwright browser's page. You **must** navigate it to `base_url` yourself with `mcp__chrome-devtools__navigate_page` **before** starting any trace; otherwise the trace measures whatever page that browser was already on and the metrics are meaningless. The two browsers do not share state — `mcp__playwright__browser_navigate` only moves the Playwright browser, never the chrome-devtools one, and **the application session does not carry over from the Playwright browser either**. Step 3 clears the Playwright browser only, so this one reaches a known state solely through the navigate and sign-in steps prescribed here, which are mandatory rather than a fallback for a blank page. For an **auth-gated** performance test you therefore sign the chrome-devtools browser in yourself, using its own interaction tools (`mcp__chrome-devtools__take_snapshot`, `mcp__chrome-devtools__fill` / `mcp__chrome-devtools__fill_form`, `mcp__chrome-devtools__click`, `mcp__chrome-devtools__wait_for`) against the **same `<auth_provider>` route** the Playwright path uses (see "Authentication" and the MCP-selection rule) — never a third-party pop-up route — before navigating to the target surface and tracing.
```

with

```text
**Second browser for performance tests.** A **performance / Core Web Vitals** test also drives chrome-devtools MCP (`mcp__chrome-devtools__*`), a distinct server with its **own** browser instance, also shared across dispatches: **its page and its session are both unknown on arrival**, it shares no state with the Playwright browser, and step 3 does not clear it. It reaches a known state only through the navigate and sign-in steps `## Which MCP to use` prescribes, which are mandatory rather than a fallback for a blank page.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/qa-tester.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`. Its `SHARED-PENDING` lines do not name `qa-tester.md`.
- `git grep -n -e '^3\. \*\*Establish your own starting state' -- plugin/agents/qa-tester.md` prints one line, so `## Preconditions` step 3 keeps its number.
- `git grep -n -F -e 'Park the account you drive' -- plugin/agents/qa-tester.md` still prints one line. `plugin/scripts/reserve-qa-user.sh` and `plugin/scripts/release-qa-user.sh` cite that label, and Task 8 owns its paragraph.
- `git diff -- plugin/agents/qa-tester.md` shows hunks only above `## Which MCP to use (per-test selection rule — follow verbatim)`. Inside `## Resolved values` it shows only the `<qa_port_seed>` and `<dev_server_cmd>` rows.

### Task 8 — Thin `qa-tester`'s `## Which MCP to use` and `## How it tests`

**Goal:** Cut `## Which MCP to use (per-test selection rule — follow verbatim)` and `## How it tests` of `plugin/agents/qa-tester.md` to direct rules stated once. Every tool sequence, guard, exit-code branch and blocked route stays.

**Depends on:** Task 7, which points `## Preconditions` → "Second browser for performance tests" at `## Which MCP to use` for the navigate and sign-in steps. That pointer only holds while this section keeps them.

**Where this task stops.** It changes only these parts of `plugin/agents/qa-tester.md`:
- in `## Which MCP to use`: the Playwright default's last sentence, the chrome-devtools lead-in's rationale, the auth-gated step 1, and the never-trace bullet;
- in `## How it tests`: the one-line intro (deleted); the finding-elements, waiting, `browser_evaluate`, mocking, asserting and complex-flows bullets; the sequential-peer paragraph; the authentication bullet with its credentials and account sub-bullets; one sentence of the parking paragraph; the busy exit code; the release paragraph's last sentence; and the account-semantics and don't-report-blocked sub-bullets.

It does not touch the public-surface and auth-gated sequences beyond step 1, the follow-the-annotation bullet, the clicking bullet, the three cause sub-bullets and the full-run paragraph under complex flows, the exit-code `0`, `2` and `1` bullets, or any heading. No frozen text falls inside this range.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**What other files read here, which this task keeps:**
- **The capability set.** `ui-tests-plan-writer.md` and `ui-tests-plan-reviewer.md` read this file's frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section as the capability set they annotate and grade from (Tasks 2 and 5). The section must still state on its own:
  - Playwright as the default for interaction, navigation, network, console and request mocking;
  - chrome-devtools only for performance / Core Web Vitals (LCP, CLS, INP, trace-based analysis);
  - both trace sequences;
  - that the per-test annotation is followed and the server is never switched on your own initiative.
- **The parking label.** `**Park the account you drive (so parallel QA sessions never collide on one account).**`, which `plugin/scripts/reserve-qa-user.sh` and `plugin/scripts/release-qa-user.sh` cite, with all four exit-code bullets: `reserve-qa-user.sh` says this file "branches on all four of those codes".
- **The credentials rule.** The direct read of `<repo_root>/<qa_creds_path>`, which `plugin/hooks/allow-qa-credentials-read.sh` relies on ("`agents/qa-tester.md` says to read the file directly").
- **The `browser_evaluate` hang rule.** `cli/templates/claude/settings.autonomous.qa.json` `_README` describes it: the tool has no timeout of its own, and an unbounded `await` hangs.
- **The `browser_route` grant check**, cited from that `_README`; and the screenshot path `<state_dir>/qa_artifacts/<branch>/qa_<test-id>.png`, which `cli/templates/repo/gitignore.qa` describes.
- **The blocked-vs-failed rule** the two mobile stubs list as inherited: a precondition a peer sign-in or a documented UI setup reaches is not `blocked`.

### Targets

- `plugin/agents/qa-tester.md` → `## Which MCP to use (per-test selection rule — follow verbatim)` and `## How it tests`, the parts named above.

**Work:**

- [ ] **Which MCP to use.** Apply R1–R4. The never-trace bullet keeps:
  - the confirm-before-`performance_start_trace` guard;
  - the three places the browser may be on arrival;
  - the rule that arriving elsewhere is not a block;
  - both blocked causes, each returning the per-test `error: blocked — ` line without tracing.
- [ ] **Locating, waiting, evaluating, mocking and asserting.** Apply R5–R10.
  - Network and console tool use is stated once, under **Asserting:**.
  - The mocking bullet keeps the call-only-when-asked rule, the main-checkout profile resolution, the never-read-`<repo_root>/.claude/settings.autonomous.json` rule and all three blocked causes.
  - The screenshot rule keeps the path, the `qa_` prefix, the plain `mkdir -p` run as its own command, and the ban on the repository root.
- [ ] **Flows and authentication.** Apply R11–R13. R13 drops the "*Replace with your project's …*" scaffolding and states the sign-in step shape directly. It keeps the pop-up ban, the development-mode-build caveat, the route-absent blocked return, the self-read and its blocked return, the rights-to-slot rule, the agnostic default and the switch-accounts route.
- [ ] **Parking and blocked.** Apply R14–R17. All four exit-code branches stay. The `3` branch keeps retry-another-slot, retry-with-no-arg, block-when-only-that-account-fits and never spin-wait. Release-before-return stays on every exit path. The don't-report-blocked bullet keeps both techniques and the genuinely-uncreatable list; its last sentence goes, because the complex-flows sub-bullet **the UI-test file omitted a setup step** states the same Should Fix route.
- [ ] **Rule inventory before saving.** Read old and new side by side and confirm every rule named in this file's Work bullets and in **What other files read here** has a home. Restore anything missing in its shortest form.

### Replacements

**R1** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 request mocking. This is the primary server and covers the large majority of tests.
```

with

```text
 request mocking.
```

**R2** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 (LCP, CLS, INP, trace-based bottleneck analysis). Playwright MCP has **no** Core Web Vitals support — that is the sole reason chrome-devtools MCP is registered. The chrome-devtools browser is a **separate instance whose page and session are both unknown on arrival** (see "Second browser for performance tests" above), so the sequence
```

with

```text
 (LCP, CLS, INP, trace-based bottleneck analysis), which Playwright MCP lacks. Its browser's page and session are both unknown on arrival (`## Preconditions` → "Second browser for performance tests"), so the sequence
```

**R3** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 (or to the sign-in route) — the chrome-devtools browser's page is unknown on arrival, so this is the mandatory first step.
```

with

```text
 (or to the sign-in route) — the mandatory first step.
```

**R4** — `plugin/agents/qa-tester.md`: replace

```text
- **Never trace a page you did not navigate to, and never emit such a trace as a pass.** Before calling `performance_start_trace`, confirm the chrome-devtools browser is actually on the authenticated target surface (the page you navigated/signed into) — its page is unknown on arrival, so it may be `about:blank`, the sign-in route, or **whatever surface a previous dispatch left it on**. An auth-gated performance test is blocked ONLY if the `<auth_provider>` route is genuinely unavailable to automation, or if navigation/sign-in fails so the browser cannot be moved to the authenticated target surface — **NOT** merely because it arrived on some other page (it self-bootstraps through the navigate and sign-in steps). Either way, the core guard holds: if the browser cannot be moved to the authenticated target surface, **return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`)** — do **NOT** run the trace and emit a blank-page / sign-in-page result as a pass.
```

with

```text
- **Never trace a page you did not navigate to, and never emit such a trace as a pass.** Before `performance_start_trace`, confirm the chrome-devtools browser is on the authenticated target surface. On arrival it may be on `about:blank`, the sign-in route, or **whatever surface a previous dispatch left it on**, and arriving elsewhere is not a block, because it self-bootstraps. If the `<auth_provider>` route is unavailable to automation, or navigation or sign-in fails so the browser cannot be moved onto the target surface, **return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`)** without tracing.
```

**R5** — `plugin/agents/qa-tester.md`: delete this whole paragraph together with the blank line that follows it

```text
These are your operating rules for every test case.
```

**R6** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 **note the missing attribute as a Should Fix finding** whose fix target is the application layer, so the convention's coverage improves over time. That finding makes the test a FAIL (`## Output contract` → `### 2. Some tests fail`, `must_fix_count: 0`) even when every assertion held, because a PASS writes nothing and the finding would otherwise have no carrier; the test stays `[ ]` until the attribute lands and a re-test passes.
```

with

```text
 **note the missing attribute as a Should Fix finding** whose fix target is the application layer. That finding makes the test a FAIL (`## Output contract` → `### 2. Some tests fail`, `must_fix_count: 0`) even when every assertion held.
```

**R7** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 — **never fixed sleeps.** Use `mcp__playwright__browser_network_requests` / `mcp__playwright__browser_network_request` to verify an external call or stored query fired and to inspect its headers and body; use `mcp__playwright__browser_console_messages` to assert no errors were logged (this is where the mandated logger `<convention_symbols>` surfaces its output in the browser).
```

with

```text
 — **never fixed sleeps.**
```

**R8** — `plugin/agents/qa-tester.md`: replace

```text
- **Running `browser_evaluate` safely:** `mcp__playwright__browser_evaluate` has **no timeout of its own** — if the function you inject returns a promise that never settles, the tool call hangs **indefinitely** and wedges the entire run (there is no recovery; the caller blocks on you and never reaches its own stop checkpoint). So **never `await` an unbounded promise inside an `evaluate`.** Time-box every awaited async operation with `Promise.race` against a rejecting timeout, e.g. `await Promise.race([op, new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate timeout')), 3000))])`, so a stuck operation **rejects** instead of hanging. This bites hardest on browser-storage probes: a storage `open` request can fire a **third** callback that is neither the success nor the error one — a "blocked" callback, when another connection holds the database — so a promise wired to only success and error never resolves. Always handle that third callback **as well**, and still wrap the whole thing in the timeout above. Prefer the test-attribute snapshot / `browser_wait_for` / `browser_network_requests` tools for state assertions; reach for `evaluate` only for what the DOM/snapshot genuinely cannot express, and when you do, keep the injected script synchronous or strictly time-boxed.
```

with

```text
- **Running `browser_evaluate` safely:** `mcp__playwright__browser_evaluate` has **no timeout of its own** — an injected function whose promise never settles hangs the tool call **indefinitely** and wedges the entire run. So **never `await` an unbounded promise inside an `evaluate`.** Time-box every awaited async operation with `Promise.race` against a rejecting timeout, e.g. `await Promise.race([op, new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate timeout')), 3000))])`. A browser-storage `open` request can fire a **third** callback beside success and error — "blocked", when another connection holds the database — so handle it **as well**, and still wrap the whole thing in the timeout. Prefer the test-attribute snapshot / `browser_wait_for` / `browser_network_requests` tools for state assertions; reach for `evaluate` only for what the DOM/snapshot cannot express, and keep the injected script synchronous or strictly time-boxed.
```

**R9** — `plugin/agents/qa-tester.md`: replace

```text
- **Mocking requests when a test needs it:** use `mcp__playwright__browser_route` to stub a backend response (e.g. to drive an error path or isolate the UI from a flaky dependency) — **only** when the UI-test detail file calls for it. Confirm first that the run grants it: the generated unattended profile deliberately omits `mcp__playwright__browser_route` for the adopter to add (`cli/templates/claude/settings.autonomous.qa.json` `_README`), and an un-granted tool **stalls** the whole run instead of erroring. Read the profile the run was launched with: `.claude/settings.autonomous.json` under the **main** checkout, the path on the first `worktree ` line of a bare `git worktree list --porcelain` — the same resolution the watcher uses for its `--settings` flag. Never read `<repo_root>/.claude/settings.autonomous.json`: the profile is machine-local and gitignored, so a run's worktree carries none, and its absence there says nothing about the grant. If `mcp__playwright__browser_route` is absent from that file's `permissions.allow`, or the file cannot be read, return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) without calling it. Note `browser_route` is also **not reliably exposed by a live Playwright MCP**, and it cannot intercept a long-lived streaming transport a realtime backend keeps open, so a test that depends on it to force a **backend-failure path** may be unrunnable; a granted `browser_route` that is not exposed or cannot intercept what the test needs returns the same line. There is typically **no** substitute available to you: network-condition / offline emulation is commonly out of reach (the chrome-devtools `emulate` tool is often permission-denied in a headless run environment) and you are read-only on application code, so you cannot induce a real backend failure another way. When a test's assertion depends on a backend operation **actually failing** and request-mocking is unavailable, return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) — a documented assumption, no fix loop; do not try to fake the failure.
```

with

```text
- **Mocking requests when a test needs it:** use `mcp__playwright__browser_route` to stub a backend response **only** when the UI-test detail file calls for it, and only once you have confirmed the run grants it — an un-granted tool **stalls** the whole run instead of erroring, and the generated unattended profile omits it for the adopter to add (`cli/templates/claude/settings.autonomous.qa.json` `_README`). Read the profile the run was launched with: `.claude/settings.autonomous.json` under the **main** checkout, the path on the first `worktree ` line of a bare `git worktree list --porcelain`. Never read `<repo_root>/.claude/settings.autonomous.json`: the profile is machine-local and gitignored, so a run's worktree carries none. Return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) without calling it when `mcp__playwright__browser_route` is absent from that file's `permissions.allow` or the file cannot be read; when a granted one is not exposed, or cannot intercept what the test needs (a long-lived streaming transport, for one); and when an assertion depends on a backend operation **actually failing** and mocking is unavailable — you have no other way to induce a real failure, so never fake one.
```

**R10** — `plugin/agents/qa-tester.md`: replace

```text
- **Asserting:** read the value and status test attributes from the snapshot for state assertions; use `mcp__playwright__browser_network_requests` / `mcp__playwright__browser_network_request` to confirm the right backend call happened with the right shape (external-call name, payload field names — read those off the conventions document of the layer that owns the wire surface); use `mcp__playwright__browser_console_messages` to assert the console is free of errors. Write what you observed in the project's own vocabulary (`<impl_stack>`), not a remembered one. For a **performance test**, first get the chrome-devtools browser onto the target surface — navigate it to `base_url` with `mcp__chrome-devtools__navigate_page` (its page is unknown on arrival), and if the surface is auth-gated, sign it in through the `<auth_provider>` route first (see the MCP-selection rule) — then assert against the `mcp__chrome-devtools__performance_analyze_insight` output and the Core Web Vitals thresholds the UI-test file specifies. If the chrome-devtools browser cannot be moved onto the authenticated target surface — whether it arrived on `about:blank`, the sign-in route or the page a previous dispatch left it on — return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) rather than asserting on that page's trace. Screenshots (`mcp__playwright__browser_take_screenshot`) are a **last resort** for visual-only checks the DOM cannot express — screenshots are **not parsed automatically**; attach one to a finding for the human, do not use it as the primary assertion. Take one only with an explicit `filename` of `<state_dir>/qa_artifacts/<branch>/qa_<test-id>.png` — the basename always starts `qa_` — after a plain `mkdir -p <state_dir>/qa_artifacts/<branch>`, run as its own command and never as a compound one: a file written at the repository root falls outside the untracked `<state_dir>/…` artifacts an unattended run's launch check tolerates, and you have no permitted way to delete it.
```

with

```text
- **Asserting:** read the value and status test attributes from the snapshot for state assertions; use `mcp__playwright__browser_network_requests` / `mcp__playwright__browser_network_request` to confirm the right backend call fired with the right shape (external-call name, payload field names — read those off the conventions document of the layer that owns the wire surface); use `mcp__playwright__browser_console_messages` to assert the console is free of errors (the mandated logger `<convention_symbols>` surfaces its output there). Write what you observed in the project's own vocabulary (`<impl_stack>`). For a **performance test**, get the chrome-devtools browser onto the target surface per `## Which MCP to use`, then assert against the `mcp__chrome-devtools__performance_analyze_insight` output and the Core Web Vitals thresholds the UI-test file specifies. Screenshots (`mcp__playwright__browser_take_screenshot`) are a **last resort** for visual-only checks the DOM cannot express, attached to a finding for the human — nothing parses them, so never the primary assertion. Take one only with an explicit `filename` of `<state_dir>/qa_artifacts/<branch>/qa_<test-id>.png` — the basename always starts `qa_` — after a plain `mkdir -p <state_dir>/qa_artifacts/<branch>`, run as its own command and never as a compound one; never write one at the repository root.
```

**R11** — `plugin/agents/qa-tester.md`: replace

```text
- **Following complex flows:** do **NOT** improvise *undocumented* multi-step flows. Each UI-test detail file spells out the steps, the expected test-attribute states, and the expected network calls — execute those steps **in order**. If
```

with

```text
- **Following complex flows:** execute the detail file's steps **in order**, and never improvise an *undocumented* multi-step flow. If
```

**R12** — `plugin/agents/qa-tester.md`: replace (the Old block opens with two spaces)

```text
  **Sequential-peer and data-bootstrap steps are documented execution, not improvisation:** when a test file's steps tell you to sign out and sign back in as a peer account (sequential peer verification), or to create setup data through the UI before exercising a behaviour (e.g. add items until a list crosses the page size, then reopen the surface to reach load-more), **execute those steps** — that is the test, not improvising. These techniques are single-sourced in `.claude/qa_test_scenarios.md` ("QA techniques"). Setup writes hit the project's **real backend** like any QA submission — acceptable; do not try to clean them up.
```

with

```text
  **Sequential-peer and data-bootstrap steps are documented execution, not improvisation:** when a test file's steps sign out and back in as a peer account, or create setup data through the UI first (`.claude/qa_test_scenarios.md`, "QA techniques"), **execute those steps**. Setup writes hit the project's **real backend**; do not clean them up.
```

**R13** — `plugin/agents/qa-tester.md`: replace

```text
- **Authentication:** flows that require a signed-in account have their auth requirement described in the UI-test file's **Preconditions**. Automated QA signs in **only** through the `<auth_provider>` route, which is the one the toolset can actually drive. A route that hands off to a **third-party pop-up window** you **CANNOT** drive (cross-origin, isolated pop-up) — do **NOT** attempt such a control, whichever provider it belongs to. *Replace with your project's sign-in locators* — the identity-attribute values of the `<auth_provider>` route's input controls, its submit control and its in-flight indicator, read off the conventions document of the layer that owns the application's surfaces. The step shape to keep: type each credential value into its input control, activate the submit control, then `mcp__playwright__browser_wait_for` the in-flight indicator (its status-attribute token) to clear and the main application shell to render. This authenticates against the project's **real backend** with the supplied credentials. Note that the route the phase drives may exist **only under the development-mode build** the configured `<dev_server_cmd>` produces (a build-mode gate the project's bundler exposes) and be absent from a production build; and that an account which exists only under a route you cannot drive will be rejected by the one you can. If the `<auth_provider>` route is absent (not a development-mode build, or a branch without it) and no other drivable sign-in exists, each auth-gated test returns the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`), not a FAIL.
  - **Where credentials come from.** Read the gitignored file at `<repo_root>/<qa_creds_path>` directly; the read is permission-friendly (no prompt). Prefer an explicit `test_credentials` arg when the caller passes one (optional override). If the file is **absent or empty** and no override was passed, an auth-gated test returns the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`), never a silent pass; a test that needs no sign-in is unaffected.
  - **Which account.** The file holds this project's test accounts — one block each, however many there are — distinguished by an account index in the key name; the exact key-name prefix convention is stated in that file's own header comments, and that is the only place it is stated. **You decide which account each test runs as** — the caller never tells you (it never reads credentials). A test that **names** a specific account, or asserts on a **rights-specific** state (a cross-account gated view, a check that turns on which rights an account holds), dictates its account; map the required rights to a block using the **per-account comments** in `<qa_creds_path>`. *Replace with your project's accounts and the rights each holds* — the shape to keep is this project's accounts, with each account's relationships and rights documented beside it, never restated here. A test that does **not** care which account it runs as (a plain "is a signed-in user" check) uses the **agnostic default** — any available account. Where the project has more than one account: when a step requires acting as a different one, sign in as it through the **same `<auth_provider>` route** using its own block, and to **switch** mid-test sign out through the path the project documents — the concrete control is the "Logging out" technique in `.claude/qa_test_scenarios.md`, which a single-account project deletes.
```

with

```text
- **Authentication:** a test's auth requirement is in its **Preconditions**. Sign in **only** through the `<auth_provider>` route; never attempt a control that hands off to a **third-party pop-up window** (cross-origin, isolated), whichever provider it belongs to. Read that route's input controls, submit control and in-flight indicator off the conventions document of the layer that owns the application's surfaces; type each credential value into its input control, activate the submit control, then `mcp__playwright__browser_wait_for` the in-flight indicator's status-attribute token to clear and the main application shell to render. This signs in against the project's **real backend**. The route may exist **only under the development-mode build** `<dev_server_cmd>` produces, and an account that exists only under a route you cannot drive is rejected by the one you can. If the `<auth_provider>` route is absent and no other drivable sign-in exists, each auth-gated test returns the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`), not a FAIL.
  - **Where credentials come from.** Read the gitignored file at `<repo_root>/<qa_creds_path>` directly; the read is permission-friendly (no prompt). If the file is **absent or empty** and no `test_credentials` override was passed, an auth-gated test returns the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`), never a silent pass; a test that needs no sign-in is unaffected.
  - **Which account.** The file holds this project's test accounts, one block each, distinguished by an account index in the key name (its header comments state the prefix convention). **You decide which account each test runs as**; the caller never tells you. A test that **names** an account, or asserts on a **rights-specific** state (a cross-account gated view, a check that turns on which rights an account holds), dictates its account: map the required rights to a block using the **per-account comments** in `<qa_creds_path>`. Any other test uses the **agnostic default** — any available account. To act as a different account mid-test, sign out through the "Logging out" technique in `.claude/qa_test_scenarios.md`, then sign in as it through the same `<auth_provider>` route with its own block.
```

**R14** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 to park the **first free** account (the agnostic default). The script only locks the slot **you** choose — it never picks an account by rights or any other criterion; the rights→slot decision is entirely yours. Branch on its exit code:
```

with

```text
 to park the **first free** account (the agnostic default). Branch on its exit code:
```

**R15** — `plugin/agents/qa-tester.md`: replace (the Old block opens with four spaces)

```text
    - **`3` (busy)** — the account you asked for is already parked by a parallel session. **You** decide what to do: if any account satisfies the test, retry with a **different** specific slot or with **no arg** for any free account; if only that specific account's rights satisfy the test and it stays busy, return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) — a documented assumption: no park, no fix loop. A couple of quick retries are fine; do **not** spin-wait indefinitely.
```

with

```text
    - **`3` (busy)** — a parallel session holds that account. If any account satisfies the test, retry with a **different** specific slot or with **no arg**; if only that account satisfies it and it stays busy after a couple of quick retries, return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`). Never spin-wait.
```

**R16** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 with `bash ${CLAUDE_PLUGIN_ROOT}/scripts/release-qa-user.sh <slot>`. If you crash without releasing, a TTL guard reclaims the lock so an account is never permanently retired; still, always release explicitly.
```

with

```text
 with `bash ${CLAUDE_PLUGIN_ROOT}/scripts/release-qa-user.sh <slot>`.
```

**R17** — `plugin/agents/qa-tester.md`: replace (the Old block opens with two spaces)

```text
  - **Account-to-account semantics (execution aid — so you can tell an expected gated/empty state from a real defect).** Apply the **cross-account visibility rules** in `.claude/qa_test_scenarios.md` — optional there, so a project that states none has none — to distinguish an expected gated or empty state from a real defect.
    - The concrete **per-account values** (which account holds which rights toward which) are single-sourced in `<qa_creds_path>`'s per-account comments — read them there at test time.
  - **Don't report `blocked` for something a peer sign-in or a UI setup step would reach.** Before recording an auth- or seed-driven precondition as `blocked`, apply the techniques in `.claude/qa_test_scenarios.md` ("QA techniques"). If a cross-account assertion needs the peer's view, **sign out and sign in as the peer** and read it there (you do not need a live peer session — the acting account's own live view already covered the live-update assertion). If the precondition is just **too little data** and a QA account can create it through the application, **create it via the documented UI action** (e.g. add items until the list crosses the page size, then reopen the surface to reach load-more) and proceed. Performing such a setup with the **same documented UI actions** the application exposes is **not** the forbidden "improvise" case — it reaches the state the test targets without changing what is asserted; note what setup you performed in the finding when the test produces one; a passing test's return stays the single `verdict: PASS` line. Reserve the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) for data that is **genuinely uncreatable** by any QA action — an account beyond the documented set, an elevated-privilege account, a peer holding rights the documented accounts don't provide. If the test file *should* have included such a setup step but didn't, that is a **Should Fix against the UI-test plan** (the test-file fix target) and so a FAIL (`### 2. Some tests fail`, `must_fix_count: 0`), not a `blocked`.
```

with

```text
  - **Account-to-account semantics.** Tell an expected gated or empty state from a real defect with the **cross-account visibility rules** in `.claude/qa_test_scenarios.md` (optional there: a project that states none has none) and the **per-account values** in `<qa_creds_path>`'s per-account comments, read at test time.
  - **Don't report `blocked` for something a peer sign-in or a UI setup step would reach.** Apply the techniques in `.claude/qa_test_scenarios.md` ("QA techniques") first: for a peer's view, **sign out and sign in as the peer** and read it there (no live peer session is needed); for **too little data** a QA account can create, **create it via the documented UI action** (e.g. add items until the list crosses the page size, then reopen the surface to reach load-more) and proceed. Such a setup is not improvising and changes nothing asserted: note it in the finding when the test produces one, and a passing test still returns the single `verdict: PASS` line. Reserve the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) for data **genuinely uncreatable** by any QA action — an account beyond the documented set, an elevated-privilege account, a peer holding rights the documented accounts don't provide.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/qa-tester.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e "Replace with your project's" -- plugin/agents/qa-tester.md` prints nothing.
- `git grep -n -e '^    - \*\*.[0-3].' -- plugin/agents/qa-tester.md` prints one line for each of the exit codes `0`, `3`, `2` and `1`, in that order.
- `git diff -- plugin/agents/qa-tester.md` shows hunks only between `## Which MCP to use (per-test selection rule — follow verbatim)` and `## Unsolicited dispatch guidance`.

### Task 10 — Thin both mobile `qa-tester` stubs, identically except for their variant words

**Goal:** Cut `plugin/agents/qa-tester-mobile-maestro.md` and `plugin/agents/qa-tester-mobile-mcp.md` to direct rules stated once, writing the text they share identically into both. Where the two copies differ today in a variant word — the variant's name, `runner` / `server`, `invoke no runner, install nothing` / `open no session`, the driver-specific half — the difference stays and nothing else differs.

**Depends on:** Task 9, the last edit to `qa-tester.md`. Both stubs point at its `## Output contract` → "4. The run cannot proceed" and at its driver-neutral contract, which Task 9 finishes. Task 7 left `qa-tester.md`'s driver gate naming both stubs as declared but not implemented.

**Where this task stops.** It changes only these parts of each stub:
- the last sentence of the declaration line;
- the phase gate, the driver gate and the not-implemented paragraph;
- the last clause of the `## Resolved values` preamble and the `<qa_driver>` row's description cell;
- `## What this variant would drive`;
- the tool-closure text: the `**Never open a browser.**` bullet in `qa-tester-mobile-maestro.md`, the `## Tool closure — why the allowlist is `Read` only today` paragraphs in `qa-tester-mobile-mcp.md`;
- the `**Never install, launch, restart or tear down …**` bullet;
- the two paragraphs of `## Operating contract — inherited by pointer`.

It does not touch the frontmatter, the fenced `error:` literal, the "Stopping loudly" paragraph, the table header, the `**Never edit application code, …**` and `**Never return a pass while this variant is unimplemented**` bullets, `qa-tester-mobile-mcp.md`'s `**Never open a browser**` bullet, or any heading. Each stub keeps its `## Resolved values` table, as `.claude/context/plugin.md` → `## The sections an asset carries` requires, and carries no `## Invocation contract` or `## Output contract`.

Apply the replacements below exactly. Each **Old** block is an exact substring of its file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word in both files:
- in the phase gate, `is `true` in `harness.config.json`.** With the phase off the project` and `A dispatch that arrives anyway is a caller bug, not a licence to improvise —`;
- in the `## Resolved values` preamble, `as an ordinary placeholder. Ordinary **path placeholders** are deliberately not listed — the body's own text resolves each where it`, and the table header.

These bold leads, which both stubs carry, stay in both:
- `**Skip this phase unless `phases.qa` is `true` in `harness.config.json`.**`;
- `**Not implemented in this release — this is the terminal outcome, not a routing hop.**`;
- `**Never install, launch, restart or tear down the application, the device or the emulator.**`;
- `**Never edit application code, never edit the UI-test plan, and never flip a readiness checkbox**`;
- `**Never return a pass while this variant is unimplemented**`.

**Text other files quote or grep, which this task keeps byte for byte:**
- `This file is a **declaration**: it reserves the dispatch name, fixes the tool closure, and records what this variant would drive and which contract it would follow.` — quoted by `ARCHITECTURE.md` §10.
- `Stopping loudly is the point. A silent success here would report "nothing observed" from an application nothing ever reached, …` — quoted by `ARCHITECTURE.md` §10.
- The fenced `error: qa.driver is <variant>; …` literal and its phrase `declared but not implemented in this release`, which `cli/src/config/model.ts` → `QA_DRIVER_IMPLEMENTED` names as a sweep key.
- What `plugin/agents/README.txt` says each stub carries: valid frontmatter, its own allowlist, a statement of what it would drive, and a pointer to `qa-tester.md` for the driver-neutral half; and a `Read`-only allowlist that never gains a browser namespace.
- The heading `## What this variant would drive`, which `.claude/context/plugin.md` cites.

### Targets

- `plugin/agents/qa-tester-mobile-maestro.md` → the parts named above.
- `plugin/agents/qa-tester-mobile-mcp.md` → the parts named above.

**Work:**

- [ ] **Gates.** Apply R1–R8.
  - Each stub's three gates keep their order: phase, then driver, then not-implemented.
  - The driver gate keeps the full routing: `web-playwright` → `qa-tester.md` (implemented), the other stub (declared, not implemented).
  - The not-implemented paragraph keeps the do-nothing list on **every** dispatch and the pointer to `qa-tester.md` → `## Output contract` → "4. The run cannot proceed".
- [ ] **Resolved values and scope.** Apply R9–R14. The `<qa_driver>` row keeps `**This file declares the `<variant>` value and no other**` and its `phases.qa` gate. `## What this variant would drive` keeps three bullets: what is driven and how, no browser and **no `base_url`** with the dispatch handle pinned at implementation, and the project's own test-attribute family.
- [ ] **Closure, lifecycle and pointer.** Apply R15–R19. Both stubs keep:
  - `Read` alone today;
  - widening only at implementation, with the tools used (`Bash` among them for maestro, the pinned server's namespace for mcp);
  - never a browser-automation namespace;
  - never restored on sight;
  - the caller owning the device lifecycle;
  - the one-way pointer to `qa-tester.md` naming the inherited driver-neutral parts.
- [ ] **Rule inventory before saving.** Diff the two stubs against each other (`git diff --no-index -- plugin/agents/qa-tester-mobile-maestro.md plugin/agents/qa-tester-mobile-mcp.md`). Every differing line is one of: a line that differs only in a variant word listed under **Goal**; the frozen frontmatter; the first `## What this variant would drive` bullet, which names each variant's own driver; `qa-tester-mobile-mcp.md`'s `## Tool closure — why the allowlist is `Read` only today` section; or the maestro-only `**Never open a browser.**` bullet. Neither file names a capability set, so `ui-tests-plan-writer.md`'s `n/a (<qa_driver> variant declares no capability set)` marker stays valid.

### Replacements

**R1** — `plugin/agents/qa-tester-mobile-maestro.md`: replace (the Old block opens with one space)

```text
 and which contract it would follow. It does not yet drive anything.
```

with

```text
 and which contract it would follow.
```

**R2** — `plugin/agents/qa-tester-mobile-mcp.md`: replace (the Old block opens with one space)

```text
 and which contract it would follow. It does not yet drive anything.
```

with

```text
 and which contract it would follow.
```

**R3** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
With the phase off the project runs no interactive tests at all: no UI-test plan is ever written, so there is no test case to execute and nothing to drive. A dispatch
```

with

```text
With the phase off the project runs no interactive tests. A dispatch
```

**R4** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
With the phase off the project runs no interactive tests at all: no UI-test plan is ever written, so there is no test case to execute and nothing to drive. A dispatch
```

with

```text
With the phase off the project runs no interactive tests. A dispatch
```

**R5** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
**Driver gate — this file is the `mobile-maestro` variant.** `<qa_driver>` selects which variant of the interactive-test agent the phase runs, and this file is one of three. **Read `<qa_driver>` before anything else.** If it is not `mobile-maestro`, you are the wrong variant for this project: read no plan, reserve no account, drive nothing, write **no** files, and return the `error:` line naming the configured driver and the variant that implements it — `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented), `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md` (declared, not implemented).
```

with

```text
**Driver gate — this file is the `mobile-maestro` variant.** **Read `<qa_driver>` before anything else.** If it is not `mobile-maestro`, you are the wrong variant for this project: return the `error:` line naming the configured driver and the variant that implements it — `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented), `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md` (declared, not implemented).
```

**R6** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
**Driver gate — this file is the `mobile-mcp` variant.** `<qa_driver>` selects which variant of the interactive-test agent the phase runs, and this file is one of three. **Read `<qa_driver>` before anything else.** If it is not `mobile-mcp`, you are the wrong variant for this project: read no plan, reserve no account, drive nothing, write **no** files, and return the `error:` line naming the configured driver and the variant that implements it — `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented), `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` (declared, not implemented).
```

with

```text
**Driver gate — this file is the `mobile-mcp` variant.** **Read `<qa_driver>` before anything else.** If it is not `mobile-mcp`, you are the wrong variant for this project: return the `error:` line naming the configured driver and the variant that implements it — `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented), `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` (declared, not implemented).
```

**R7** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
**Not implemented in this release — this is the terminal outcome, not a routing hop.** Even when `<qa_driver>` **is** `mobile-maestro`, this variant runs no test: the driver-specific half of the work — how a device runner is invoked, how elements are located in a view hierarchy, how a step's result is read back — is exactly what this file does not yet supply. So on **every** dispatch, whatever the configuration: read no UI-test plan, reserve no account, invoke no runner, install nothing, write **no** files, and return the single-line run-level `error:` shape of `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → "4. The run cannot proceed", naming this variant and its release status so the caller surfaces a blocker instead of recording an untested run as a pass:
```

with

```text
**Not implemented in this release — this is the terminal outcome, not a routing hop.** Even when `<qa_driver>` **is** `mobile-maestro`, this variant runs no test. On **every** dispatch, whatever the configuration: read no UI-test plan, reserve no account, invoke no runner, install nothing, write **no** files, and return the single-line run-level `error:` shape of `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → "4. The run cannot proceed"; for its own driver the line is exactly:
```

**R8** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
**Not implemented in this release — this is the terminal outcome, not a routing hop.** Even when `<qa_driver>` **is** `mobile-mcp`, this variant runs no test: the driver-specific half of the work — which device-automation server is pinned, how a session is opened against a device, how elements are located and acted on — is exactly what this file does not yet supply. So on **every** dispatch, whatever the configuration: read no UI-test plan, reserve no account, open no session, write **no** files, and return the single-line run-level `error:` shape of `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → "4. The run cannot proceed", naming this variant and its release status so the caller surfaces a blocker instead of recording an untested run as a pass:
```

with

```text
**Not implemented in this release — this is the terminal outcome, not a routing hop.** Even when `<qa_driver>` **is** `mobile-mcp`, this variant runs no test. On **every** dispatch, whatever the configuration: read no UI-test plan, reserve no account, open no session, write **no** files, and return the single-line run-level `error:` shape of `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → "4. The run cannot proceed"; for its own driver the line is exactly:
```

**R9** — `plugin/agents/qa-tester-mobile-maestro.md`: replace (the Old block opens with one space)

```text
 the body's own text resolves each where it appears, and the dispatch keys and artifact paths this variant would consume are the ones stated in the operating contract it points at rather than restated here.
```

with

```text
 the body's own text resolves each where it appears.
```

**R10** — `plugin/agents/qa-tester-mobile-mcp.md`: replace (the Old block opens with one space)

```text
 the body's own text resolves each where it appears, and the dispatch keys and artifact paths this variant would consume are the ones stated in the operating contract it points at rather than restated here.
```

with

```text
 the body's own text resolves each where it appears.
```

**R11** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
| `qa.driver` — which variant of the interactive-test agent the interactive-test phase runs, and so how that variant reaches the application. **This file declares the `mobile-maestro` value and no other** — see the driver gate above. Read
```

with

```text
| `qa.driver` — which variant of the interactive-test agent the phase runs. **This file declares the `mobile-maestro` value and no other**. Read
```

**R12** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
| `qa.driver` — which variant of the interactive-test agent the interactive-test phase runs, and so how that variant reaches the application. **This file declares the `mobile-mcp` value and no other** — see the driver gate above. Read
```

with

```text
| `qa.driver` — which variant of the interactive-test agent the phase runs. **This file declares the `mobile-mcp` value and no other**. Read
```

**R13** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
Recorded so an implementation of this file starts from a fixed scope rather than re-deciding it:

- An **already-installed build** of the application on a physical device or an emulator, driven through a **device-runner CLI invoked from the shell** (`Bash`). The runner replays declarative flow steps against the application's view hierarchy, asserts on view identifiers and rendered text, and captures device logs and screenshots as evidence.
- It reaches the application through that runner and through nothing else. There is no browser, no page, no URL, and therefore **no `base_url`** — the caller-supplied handle for a run of this variant is a device/emulator target and an installed build, not a served origin, and pinning that dispatch key is part of implementing this file.
- The locator convention it would assert on is the project's own test-attribute family, read off the conventions documents the configuration names, exactly as the implemented variant does — not a locator vocabulary invented here.
```

with

```text
- An **already-installed build** of the application on a physical device or an emulator, driven through a **device-runner CLI invoked from the shell** (`Bash`). The runner replays declarative flow steps against the application's view hierarchy, asserts on view identifiers and rendered text, and captures device logs and screenshots as evidence.
- It reaches the application through that runner alone: no browser and **no `base_url`**. Its dispatch handle is a device/emulator target and an installed build, and pinning that key is part of implementing this file.
- It would assert on the project's own test-attribute family, read off the conventions documents the configuration names, as the implemented variant does.
```

**R14** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
Recorded so an implementation of this file starts from a fixed scope rather than re-deciding it:

- An **already-installed build** of the application on a physical device or an emulator, driven through a **device-automation MCP server** the adopting project registers itself — snapshotting the on-screen view hierarchy, tapping and typing into elements, and reading state back off element identifiers and rendered text. The plugin ships no server registration, for this variant no more than for the implemented one.
- It reaches the application through that server and through nothing else. There is no browser, no page, no URL, and therefore **no `base_url`** — the caller-supplied handle for a run of this variant is a device/emulator target and an installed build, not a served origin, and pinning that dispatch key is part of implementing this file.
- The locator convention it would assert on is the project's own test-attribute family, read off the conventions documents the configuration names, exactly as the implemented variant does — not a locator vocabulary invented here.
```

with

```text
- An **already-installed build** of the application on a physical device or an emulator, driven through a **device-automation MCP server** the adopting project registers itself — snapshotting the on-screen view hierarchy, tapping and typing into elements, and reading state back off element identifiers and rendered text. The plugin ships no server registration, for this variant no more than for the implemented one.
- It reaches the application through that server alone: no browser and **no `base_url`**. Its dispatch handle is a device/emulator target and an installed build, and pinning that key is part of implementing this file.
- It would assert on the project's own test-attribute family, read off the conventions documents the configuration names, as the implemented variant does.
```

**R15** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
- **Never open a browser.** Its `tools:` allowlist carries a single built-in tool, `Read` — enough to resolve `<qa_driver>` and no more — and grants **no** browser-automation tools; that omission is the mechanism, and it holds when this variant is implemented too. A device runner is reached through `Bash`, so this file needs no tool namespace beyond the built-ins — but every dispatch stops at the not-implemented `error:` above, so this variant may write no file and execute no shell command, and granting `Bash`, `Write`, `Glob` or `Grep` today would be a grant that resolves to nothing and a false signal to anyone auditing which agents can execute or write. **The allowlist widens at implementation time, with the tools the implementation actually uses — `Bash` among them** — rather than being restored on sight.
- **Never install, launch, restart or tear down the application, the device or the emulator.** The caller owns that lifecycle end to end, exactly as it owns the server lifecycle for the implemented variant; an unreachable target is an `error:`, not a cue to provision one.
```

with

```text
- **Never open a browser.** The `tools:` allowlist is `Read` alone and grants **no** browser-automation tools, now or after implementation. It widens only at implementation time, with the tools the implementation actually uses — `Bash` among them, since a device runner is reached through it — and is never restored on sight.
- **Never install, launch, restart or tear down the application, the device or the emulator.** The caller owns that lifecycle; an unreachable target is an `error:`, not a cue to provision one.
```

**R16** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
This file ships with a single built-in tool, `Read` — enough to resolve `<qa_driver>` from `harness.config.json` and no more — and that narrowing is deliberate rather than an omission to be corrected on sight. Every dispatch stops at the not-implemented `error:` above, so this variant may write no file and execute no shell command; granting `Write`, `Bash`, `Glob` or `Grep` today would be a grant that resolves to nothing and a false signal to anyone auditing which agents can execute or write. **The allowlist widens at implementation time, with the tools the implementation actually uses** — so do not restore the rest of the built-in set on sight.

The same withhold-until-needed rule governs the device namespace: **a device-automation tool namespace is added to the `tools:` allowlist only when this variant is implemented and the server that provides it is pinned.** Declaring a namespace now would ship an allowlist naming tools no registered server exposes — a grant that resolves to nothing, and a false signal to anyone auditing which agents can reach a device.

What that later addition may **never** include is a browser-automation namespace. Those tools belong to exactly one file, `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, whose own allowlist is the only grant of them in the plugin; the closure is enforced by every other agent's allowlist omitting them, so this file's omission is load-bearing today and stays load-bearing after implementation. A device-automation server is a different namespace with a different purpose, and adding one here never widens the browser closure.
```

with

```text
This file ships with a single built-in tool, `Read` — enough to resolve `<qa_driver>` from `harness.config.json` — and the narrowing is deliberate: every dispatch stops at the not-implemented `error:` above, so this variant writes no file and runs no shell command. **The allowlist widens at implementation time, with the tools the implementation actually uses** — never restored on sight.

A device-automation tool namespace joins the allowlist only when this variant is implemented and the server that provides it is pinned. That later addition may **never** include a browser-automation namespace: `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` holds the plugin's only grant of those tools, and this file's omission stays load-bearing after implementation.
```

**R17** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
- **Never install, launch, restart or tear down the application, the device or the emulator.** The caller owns that lifecycle end to end, exactly as it owns the server lifecycle for the implemented variant; an unreachable target is an `error:`, not a cue to provision one.
```

with

```text
- **Never install, launch, restart or tear down the application, the device or the emulator.** The caller owns that lifecycle; an unreachable target is an `error:`, not a cue to provision one.
```

**R18** — `plugin/agents/qa-tester-mobile-maestro.md`: replace

```text
Everything driver-neutral about interactive testing is already written once, in `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, and this variant inherits it rather than restating it. Read that file for: the **invocation contract** and its dispatch keys; the **two absolute boundaries** (the caller owns the application's lifecycle; you are read-only on the test index and every per-test file); the **blocked-vs-failed discipline**, including the rule that a precondition reachable by a peer sign-in or a documented setup action is not `blocked`; the **account reserve/release parking protocol** and its exit-code branches; the **per-single-test dispatch mode** with its namespaced artefact filenames; the **split index plus per-finding output format**, whose readiness list carries the layer tag and whose fix target is application code rather than the test plan; and the **four return shapes** the caller parses word for word.

That pointer runs one way. It does **not** make `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` runnable under this driver — that file is the browser variant and gates itself off when `<qa_driver>` is not `web-playwright`. What an implementation of this file must add is only the driver-specific half: how the runner is invoked, how elements are located and acted on, and how an observation is read back as evidence.
```

with

```text
An implementation of this variant inherits everything driver-neutral from `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` rather than restating it: the **invocation contract** and its dispatch keys, the **two absolute boundaries**, the **blocked-vs-failed discipline**, the **account reserve/release parking protocol**, the **per-single-test dispatch mode**, the **split index plus per-finding output format** and the **four return shapes** the caller parses word for word.

That pointer runs one way: it does **not** make `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` runnable under this driver. An implementation adds only the driver-specific half: how the runner is invoked, how elements are located and acted on, and how an observation is read back as evidence.
```

**R19** — `plugin/agents/qa-tester-mobile-mcp.md`: replace

```text
Everything driver-neutral about interactive testing is already written once, in `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, and this variant inherits it rather than restating it. Read that file for: the **invocation contract** and its dispatch keys; the **two absolute boundaries** (the caller owns the application's lifecycle; you are read-only on the test index and every per-test file); the **blocked-vs-failed discipline**, including the rule that a precondition reachable by a peer sign-in or a documented setup action is not `blocked`; the **account reserve/release parking protocol** and its exit-code branches; the **per-single-test dispatch mode** with its namespaced artefact filenames; the **split index plus per-finding output format**, whose readiness list carries the layer tag and whose fix target is application code rather than the test plan; and the **four return shapes** the caller parses word for word.

That pointer runs one way. It does **not** make `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` runnable under this driver — that file is the browser variant and gates itself off when `<qa_driver>` is not `web-playwright`. What an implementation of this file must add is only the driver-specific half: which server is pinned and registered, how a device session is opened, how elements are located and acted on, and how an observation is read back as evidence.
```

with

```text
An implementation of this variant inherits everything driver-neutral from `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` rather than restating it: the **invocation contract** and its dispatch keys, the **two absolute boundaries**, the **blocked-vs-failed discipline**, the **account reserve/release parking protocol**, the **per-single-test dispatch mode**, the **split index plus per-finding output format** and the **four return shapes** the caller parses word for word.

That pointer runs one way: it does **not** make `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` runnable under this driver. An implementation adds only the driver-specific half: which server is pinned and registered, how a device session is opened, how elements are located and acted on, and how an observation is read back as evidence.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/qa-tester-mobile-maestro.md plugin/agents/qa-tester-mobile-mcp.md` as one plain foreground command. Its last line is `PASS`, both `WORDS` lines show a negative `delta`, it prints no `SHARED-PENDING` line naming either stub, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'This file is a **declaration**: it reserves the dispatch name' -e 'Stopping loudly is the point.' -- plugin/agents/qa-tester-mobile-maestro.md plugin/agents/qa-tester-mobile-mcp.md` prints one line per string per file.
- `git grep -n -e '^## Invocation contract' -e '^## Output contract' -- plugin/agents/qa-tester-mobile-maestro.md plugin/agents/qa-tester-mobile-mcp.md` prints nothing.
- `git diff -- plugin/agents/qa-tester-mobile-maestro.md plugin/agents/qa-tester-mobile-mcp.md` shows no change to either frontmatter block or fenced `error:` literal.

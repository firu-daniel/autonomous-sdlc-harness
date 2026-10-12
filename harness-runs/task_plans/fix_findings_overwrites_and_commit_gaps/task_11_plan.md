### Task 11 — Give every qa-tester per-test block a defined return, with the `error: blocked — ` marker

**Goal:** Fix the agent half of defect 8. Several per-test blocks in `plugin/agents/qa-tester.md` have no defined carrier:

- "record a finding and report `blocked`" (`## Which MCP to use` → the "**Never trace a page you did not navigate to**" bullet);
- "report it **`blocked`** (a documented assumption — no fix loop)" (`## How it tests` → "**Mocking requests when a test needs it**", and the reserve-script exit `3` bullet);
- "record a finding and **continue to the next independent test case**" (`## How it tests` → "**Following complex flows:**");
- "record auth-gated tests as **`blocked`**" (the "**Authentication:**" bullet and its credentials sub-bullets);
- "note the missing attribute as a Should Fix finding" (the "**Finding elements:**" bullet) on a test that otherwise passes.

In practice these can return only through `error:`, which halts and escalates the whole QA phase and has no place for a finding. After this task every per-test block has one defined return: what it writes, what it returns, and whether the phase continues.

**Where this task stops.** This task defines the qa-tester's side of the wire. The callers' parsing is **Tasks 12** (the task-plan flow's Phase E), **13** (the supervised QA flow and the user-review core) and **14** (the ledger flips). All of them depend on this task and match the literal below.

### Targets

- `plugin/agents/qa-tester.md`

**The wire — four return shapes, in priority order:**

1. **`verdict: FAIL`** + `findings_file:` + `must_fix_count:` (3 lines, unchanged), whenever the test produced **any** finding. This includes:
   - an application defect;
   - a precondition the application failed to reach;
   - a setup step the UI-test file omitted (a Should Fix whose fix target is the UI-test file);
   - a missing identity test attribute, a Should Fix with `must_fix_count: 0` that targets the application layer. The test then stays `[ ]` until the attribute lands and a re-test passes.

   Any blocked part of the same test is noted in the per-dispatch index's Context roll-up.
2. **`error: blocked — test <T>: <one-line cause>`** (1 line), when the test produced no finding and could not be driven for a reason confined to **this test**. **Writes no file.** Release any reserved slot before returning. **The caller continues the QA phase**, leaves the test `[ ]` and reports the cause. The literal `error: blocked — ` (em dash, single spaces) is the wire the callers discriminate on, the same way `layer-implementer`'s `blocker: prohibited — ` is (`.claude/context/plugin.md` → `## Wires: dispatch in, return out`).
3. **`error: <one-line reason>`** with no `blocked — ` marker (1 line), **only** when nothing in the run can proceed: the phase is disabled, `<qa_driver>` names another variant, the application is unreachable, a browser namespace is unavailable, or an input file is unreadable. The caller halts, as today.
4. **`verdict: PASS`** (1 line, writes nothing), when every assertion held and nothing was noted.

**The per-test block → return mapping this task writes in:**

| Block | Return |
|---|---|
| Performance browser cannot be moved onto the authenticated target surface | shape 2 |
| `mcp__playwright__browser_route` not granted, not exposed, or unable to intercept; or the assertion needs a real backend failure | shape 2 |
| `reserve-qa-user.sh` exit `3` and only that account satisfies the test | shape 2 |
| Credentials file absent or empty with no override, or reserve exit `1`, **for an auth-gated test** | shape 2. A non-auth test is unaffected |
| The `<auth_provider>` route is absent from this build | shape 2, for each auth-gated test |
| Precondition data genuinely uncreatable by any QA action | shape 2 |
| Precondition unmet because the application misbehaved | shape 1, app fix target |
| Precondition unmet because the UI-test file omitted a setup step | shape 1, a Should Fix against the UI-test file |
| Missing identity test attribute, assertions otherwise passed | shape 1, Should Fix, `must_fix_count: 0` |

**Work:**

- [ ] `## Output contract`: split `### 3. Tests blocked` into **`### 3. A test blocked`** (shape 2: when, what is written (nothing), the exact line, slot release, that the caller continues) and **`### 4. The run cannot proceed`** (shape 3, the existing examples minus the credentials one). Keep `### 1.` / `### 2.` as they are, adding to `### 2.` that a missing-attribute or omitted-setup Should Fix is a FAIL with `must_fix_count: 0` allowed. State the priority order (FAIL over blocked over PASS). Update the opening "1 line on PASS, 3 lines on FAIL, 1 line on error" sentence to cover both `error:` shapes.
- [ ] `## Invocation contract` → "**Three return shapes, and the caller parses them word for word**": make it four, naming the `error: blocked — ` marker as a parsed literal. Change the closing per-dispatch-artefacts sentence so a blocked dispatch is described as writing nothing.
- [ ] `## Which MCP to use` and `## How it tests`: rewrite each block in the mapping table so it names its return by shape. Replace "record a finding and report `blocked`" and "report … `blocked` (a documented assumption — no fix loop)" with "return the per-test blocked line (`## Output contract` → `### 3. A test blocked`)". Point the **Authentication** credentials sub-bullets and the reserve-exit bullets at the same section.
- [ ] "**Following complex flows:**": replace "record a finding and **continue to the next independent test case**" with the three precondition rows of the table. Keep "continue to the next independent test case" only for the ad-hoc full-run mode (no `test_ids`). In that mode the single return follows the same priority: FAIL if any test produced a finding, else `error: blocked — tests <ids>: <causes>` if any test was blocked, else PASS. The index Context carries the pass/fail/blocked counts.
- [ ] "**Finding elements:**": say the missing-attribute Should Fix makes the test a shape-1 FAIL, and why: PASS writes nothing, so the finding would otherwise have no carrier.

**Verification:**

- `git grep -n -E -e 'record a finding' -e 'documented assumption' -- plugin/agents/qa-tester.md`: every remaining hit names its return shape. None says "record a finding and report `blocked`", and none says "continue to the next independent test case" outside the full-run mode.
- `git grep -n 'error: blocked — ' -- plugin/agents/qa-tester.md` shows the defined literal in `## Output contract` and each mapped block's pointer. After Tasks 12–14 the same grep across `plugin/instructions` shows each caller matching that exact string.
- Walk one dispatch per table row on paper and confirm each yields exactly one of the four shapes, and that no per-test row yields an unmarked `error:`.
- The per-dispatch file names (`qa_review_<iteration>_t<T>.md`, `finding_t<T>_<N>.md`) and the boundaries (never start the server, never flip a checkbox) are unchanged.

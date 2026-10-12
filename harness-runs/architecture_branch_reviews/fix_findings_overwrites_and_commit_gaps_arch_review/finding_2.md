### 2. Qualify the autonomous fork's closed `<escalate>` list to the unmarked `qa-tester` `error:`

**Severity:** Must Fix
**Layer:** plugin

**Site.** `plugin/instructions/user_review_fixes_instructions_autonomous.md`, the paragraph that opens *"Both bindings resolve to the **same** file-based channel and differ only in what triggers them."* It sits under the `<escalate>` / `<ask>` park-and-yield section. The stale item in its closed list is:

> … the QA dev server failing to start (E.0), a `qa-tester` returning `error:`, the `MAX_QA_ROUNDS = 3` re-test cap, …

**Problem.** This branch changes the `qa-tester` return wire. `plugin/agents/qa-tester.md` → `## Output contract` now has two `error:` shapes:

- The per-test `error: blocked — test <T>: <one-line cause>`. The caller continues the QA phase.
- An unmarked `error:`. The caller halts.

The consumers this branch edited were all narrowed to the unmarked shape:

- `plugin/instructions/plan_orchestration_instructions_core.md` → `## Stop conditions` and `## Phase E`'s E.2.
- `plugin/instructions/user_review_fixes_instructions_core.md` → `## Stop conditions` and its `<escalate>` `Used at` cell.
- `plugin/instructions/qa_test_instructions.md` → `### 4.`

This fork's list was not narrowed. It calls itself *"a **closed list** of the core's — and its cited sections' — 'a supervised flow would stop and surface here' paths, and nothing else"*. It still names every `qa-tester` `error:` as such a path, but the core it binds no longer stops on a blocked line. So the fork's definition of what reroutes through `<escalate>` disagrees with the core it binds. A headless run reading the fork could park on a per-test blocked line that E.2 says to record and continue past.

`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent` says: *"The plugin corpus quotes its own literal wire strings across files, so a rename is an edit to every quoting file … A literal only one side knows about is a silent contract break."* `.claude/context/plugin.md` → `## Wires: dispatch in, return out` says the discriminator is the literal (`error: blocked — `), and every consumer of the return must discriminate on it. The scope register's E3 grep did not reach this phrasing (`a \`qa-tester\` returning \`error:\``), so the site was missed.

**Fix.** In that one list item, replace

> a `qa-tester` returning `error:`

with

> a `qa-tester` returning an unmarked `error:` (one not beginning with the exact prefix `error: blocked — `; the per-test blocked line is E.2's blocked arm and reroutes nothing)

Change nothing else in the paragraph. The wording mirrors the qualifier `plugin/instructions/user_review_fixes_instructions_core.md` → `## Stop conditions` now carries, so the fork and the core state the same discriminator.

**Check it landed.** `git grep -n -E "qa-tester.{0,4} return(s|ing) .?error" -- plugin` should return only lines that also carry `unmarked`.

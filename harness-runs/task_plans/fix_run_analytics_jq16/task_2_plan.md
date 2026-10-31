### Task 2 — Add `cli/test/jq-floor.test.mjs`, a source guard for the jq syntax 1.5 and 1.6 reject

**Goal:** Enforce the jq 1.5 floor's syntax rules on every shipped `.jq` program on every run of the suite. The guard catches the two syntax classes jq 1.7 relaxed: a keyword used as an identifier, which is this branch's defect, and an `if` without an `else`. A jq 1.7+ host accepts both, so the suite stays green on macOS while Debian 12's jq 1.6 rejects the whole program.

**Depends on:** Task 1. Task 1 renames `latency_row`'s `$label` to `$row_label` in `cli/templates/scripts/lib/run-analytics-report.jq` and leaves neither class in either template. Without Task 1 this test fails on that line, which is the intended behaviour.

**Registration is Task 3's.** This test reads a tree of repository files, so it owes a `treeGuards` entry (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 8). **Task 3** adds `{ "test": "test/jq-floor.test.mjs", "covers": "cli/templates/scripts/**/*.jq" }` to `harness.config.json`. This task does not edit that file.

**Why a source guard, stated in the header.** This is the last-resort form (`.claude/context/conventions.md` → `## The testing bar`, *"guard the source instead"*), and its reason goes in the header. No jq older than the host's can be reached from the suite: getting one needs the network, and vendoring a binary breaks the no-runtime-dependency rule. The run under a real jq 1.6 is the by-hand route **Task 4** documents in `docs/development.md` → Gate 4, under the bold paragraph title **The suite under jq 1.6, by hand.** The header names that route by that section and title.

### Targets

- `cli/test/jq-floor.test.mjs` (new)

**Work:**

- [ ] **Header.** Open with the rule the test enforces: *every shipped `.jq` program parses on jq 1.5 and 1.6, so no jq keyword is a `$` variable, a `.` field or an object key, and every `if` has an `else`*. Then give:
  - **The reason it is a source guard**, from above.
  - **What it does not cover.**
    - Builtins newer than 1.5. Each program's own `# Floor:` header line lists the ones it avoids.
    - The jq programs embedded in shell assets: `plugin/hooks/git-trust-file-guard.sh`, the watcher's profile render in `cli/templates/scripts/autonomous-watcher.sh`, and `cli/templates/scripts/lib/harness-run-lib.sh`. Both of these gaps are left to the by-hand jq 1.6 run.
- [ ] **Enumerate the programs.** Collect every `*.jq` file under `cli/templates/scripts/`, recursively, resolved from `import.meta.url`. Assert that the set includes `lib/run-analytics.jq` and `lib/run-analytics-report.jq`, and do not assert a total count. Scan only these template files: never `scripts/` at the repository root, because no test is aimed at this repository.
- [ ] **A small lexer** that yields code tokens with line numbers.
  - `#` comments run to the end of the line and are dropped.
  - String literals are dropped, except the code inside each `\( … )` interpolation, which is lexed as code. Track nested parentheses and nested strings inside an interpolation.
  - Over the code tokens:
    - **(a)** Flag a keyword immediately preceded by `$` or `.`, or followed by optional whitespace and `:`. The keywords are `as def module import include if then elif else end and or reduce foreach try catch label`, and `__loc__` is exempt after `$`.
    - **(b)** Keep a stack: push on `if`, mark the top on `else`, pop on `end`, and flag any popped `if` that saw no `else` at its own level. `elif` changes nothing.
  - Each failure names the file, the line, the construct, and that jq 1.6 rejects it.
- [ ] **Self-check cases**, so the scanner is shown able to fail. Run the same scanner over inline programs and assert that each **flags**:
  - `def f($label): $label;`
  - `{if: 1}`
  - `.end`
  - `if . then 1 end`
  - `if . then 1 elif . then 2 end`

  And that each **passes**:
  - `"\(if . then 1 else 2 end)"`
  - `"label: \(.a | join(", "))"`
  - `# if x then y end`
  - `$__loc__`
  - `if . then (if . then 1 else 2 end) else 3 end`

**Verification:**

- `npm test --workspace cli -- test/jq-floor.test.mjs` passes on this task's own new test file, with every self-check case and both real programs passing. Run it from the repository root as one plain foreground command.
- The self-check case `def f($label): $label;` fails with a message naming its line and `label`. That is the measured defect's own shape.
- The header names `docs/development.md` → Gate 4 → **The suite under jq 1.6, by hand.** (the paragraph title Task 4 writes) as the route that covers what this guard does not.

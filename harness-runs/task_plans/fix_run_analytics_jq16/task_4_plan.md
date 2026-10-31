### Task 4 — Document Gate 4's by-hand run under Debian 12's jq 1.6 and what the floor guard does not cover

**Goal:** Give the repository a repeatable way to run its tests under an older jq, and say plainly what that route costs and what the automatic guard leaves to it. The task prompt asks for the floor to be *"enforced rather than assumed"* and, where that cannot be cheap, for the cost to be stated.

**Depends on:**
- **Task 2**, which added `cli/test/jq-floor.test.mjs`. It runs in Gate 4 (`npm test`) on every run and fails on a jq keyword used as a `$` variable, a `.` field or an object key, and on an `if` without an `else`, in every `*.jq` file under `cli/templates/scripts/`. Its header names this task's paragraph, by the title **The suite under jq 1.6, by hand.**, as the route for what it does not cover. Use that title exactly.
- **Task 3**, which registered that test in `harness.config.json` → `treeGuards`.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` binds the measured fact below: say what was measured, the command and the exact message. A deferral would need a numbered roadmap item, and this paragraph defers nothing.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → **Gate 4**, immediately after the paragraph that opens *"This gate needs `jq` 1.5 or newer on `PATH`"*

**Work:**

- [x] Add one paragraph that opens with the bold title **The suite under jq 1.6, by hand.** It states:
  - **The measured failure.** On 2026-10-30, the suite run in Gate 15's container (Debian 12, `node:22-bookworm`, `jq` from `apt-get install -y jq`) on `dev` at `1a41540c` failed with `run-analytics: lib/run-analytics-report.jq rollup failed: jq: error: syntax error, unexpected label, expecting IDENT (Unix shell quoting issues?) at <top-level>, line 233:`. jq 1.7 accepts a keyword as a variable name and jq 1.6 does not. macOS's and Homebrew's `jq` are 1.7 or newer, so a macOS run cannot show it.
  - **What runs automatically.** `cli/test/jq-floor.test.mjs` checks the two relaxed syntax classes in the shipped `.jq` programs, and nothing more. It does not cover builtins newer than 1.5, or the jq programs embedded in shell assets: the trust-file guard's payload parse, the watcher's per-run profile render, and the library's trust-check helpers.
  - **The by-hand route.** In the container that *A Linux run, in a local container* describes, `apt-get install -y jq` installs Debian 12's jq 1.6, and `jq --version` must print `jq-1.6`. To take it on a branch's head, follow *The absent-path check, by hand*'s three clone lines. Then run `npm ci` and `npm test --workspace cli`. The suite inherits `PATH`, so every jq program a test reaches runs under 1.6.
  - **What it costs, and why no gate runs it.** It needs Docker (colima), the network for the image and the package, and a person to start it. `scripts/run-gates.sh` runs no gate that needs a network, so this stays a hand-run leg of Gate 4 rather than a seventeenth gate.
  - **jq 1.5 is not taken by this route.** The container's own package is 1.6, so a 1.5 run would need a jq binary from outside that distribution, and this route does not fetch one. The 1.5 floor rests on the guard and on each program's `# Floor:` header.
- [x] Change nothing else in the section. The opening count (*"Sixteen gates"*) and the `run-gates.sh` paragraph stay as they are, because no gate is added.

**Verification:**

- `grep -n 'The suite under jq 1.6, by hand.' docs/development.md` finds exactly one line, inside `## 5. Verifying a change`, after the Gate 4 *"This gate needs"* paragraph and before *"Every test gets its **own** fixture repository"*.
- The quoted error line in the paragraph matches the task prompt's measured message byte for byte.
- `grep -n 'jq-floor.test.mjs' docs/development.md` finds the new paragraph. Its file name matches `cli/test/jq-floor.test.mjs` on disk.
- The paragraph names no machine path, account name or line number of a source file. The quoted jq error's own `line 233` is part of the measured message and stays.

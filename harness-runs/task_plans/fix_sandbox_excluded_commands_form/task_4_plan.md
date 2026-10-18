### Task 4 — Update `docs/cli.md` §6 and §7, `ARCHITECTURE.md` and `docs/sandbox-verification.md` for the corrected form

**Goal:** Every project document that describes the excluded entries says what the code now does:

- the generated spelling is `bash <repoRoot>/<scriptsDir>/<wrapper>.sh:*`;
- `doctor` reports the old `Bash(…)` spelling as stale;
- `GIT_SSH_COMMAND` is kept, on a measured basis.

The verification record says this branch is the fix, and which of its rows are owed a re-run. The re-run's results are **not** written here: they are measured by hand (story index → `Manual setup required`, steps 2 and 3), and a row's Observed cell records only what was measured.

**Depends on:**

- **Task 1.** The generator writes each `sandbox.excludedCommands` entry as `bash <repoRoot>/<scriptsDir>/push-branch.sh:*` and the same for `refresh-branch.sh`, with no `Bash(…)` wrapper. `Bash(bash <…>:*)` is now only the stale form.
- **Task 2.** `doctor`'s `profile-sandbox` reports an entry in that stale form by name: `warn` without `--remote-job`, `fail` with it, naming `init --force`. Its finding says the entry *"matches no command"* and that the wrapper runs sandboxed.
- **Task 3.** The wrapper headers keep `GIT_SSH_COMMAND`, citing `docs/sandbox-verification.md` → P1a: a sandboxed command carries the proxy `GIT_SSH_COMMAND`, and an excluded command inherits none of the sandbox's proxy variables.

This task documents those three and changes none of them.

**How this task's implementer reads the conventions.** This is the catch-all task, so read all three conventions documents. `.claude/context/conventions.md` → `## Documents of record` binds the verification record: a measured fact states what was measured, the command and the exact message, so no measured cell is edited to anticipate a result. The lessons ledger's *"Every command an adopter is meant to run sits in a fenced block"* binds any adopter command added here. Prefer pointing at the existing `init --force` fenced block under §7's `profile-sandbox` bullet over adding a new one.

### Targets

- `docs/cli.md`: §6, the paragraphs at scope register rows 9 and 10; §7, the `profile-sandbox` bullet at row 14.
- `ARCHITECTURE.md`: the permission-model row (row 1).
- `docs/sandbox-verification.md`: the headline bullet (row 16), the note under §1 (row 19), a new owed-re-run note at §3's opening (row 30), and row F3's follow-up cell (row 31).

**Work:**

- [ ] `docs/cli.md` §6, **Two wrappers run outside the sandbox, each in one spelling.** Replace the quoted `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)` with `bash <repoRoot>/<scriptsDir>/push-branch.sh:*`, and add one sentence: an `excludedCommands` entry is a bare command pattern rather than a `Bash(…)` rule. The rule form matches nothing there, and `bash <path>` without `:*` is excluded only with no argument. Measured on Claude Code 2.1.299, macOS, headless (`docs/sandbox-verification.md`, rows P1a and P2). In the next paragraph (**The excluded rule's `:*` accepts any argument …**), extend the closing clause *"and keep `GIT_SSH_COMMAND`, which an operator may rely on for the SSH push"* with the measured answer: the sandbox sets its own proxy `GIT_SSH_COMMAND` on sandboxed commands only, and an excluded command inherits none of it (P1a). So the value kept is the agent runner's own.
- [ ] `docs/cli.md` §7, the `profile-sandbox` bullet. After *"whether `excludedCommands` names exactly the two main-checkout wrapper rules"*, say that an entry in the `Bash(…)` spelling an earlier release generated is reported as **stale** by name: it matches no command, so that wrapper runs sandboxed. Say that it is graded like every other finding, a warning without `--remote-job` and a failure under it, and that the remedy is the `init --force` already fenced below the bullet.
- [ ] `ARCHITECTURE.md`, the permission-model row's second cell. After *"one command per entry, script paths unquoted, every caller-spelling listed"*, add: `sandbox.excludedCommands` takes a bare command pattern (`bash <path>:*`) rather than a `Bash(…)` rule, which it matches against nothing (`docs/sandbox-verification.md` → P1a). Change nothing else in the row.
- [ ] `docs/sandbox-verification.md`, the three existing sites. In each, keep the measured statement and add a pointer:
  - **Headline bullet** *"The two `excludedCommands` entries match nothing"*: add that `fix_sandbox_excluded_commands_form` changes the generated form to P2's.
  - **Note under §1:** add that `profile-sandbox` now grades the corrected form, and reports the `Bash(…)` one as stale.
  - **Row F3's Follow-up cell:** the branch name stays. Add the two changes it made: the generated form, and the stale finding.
- [ ] `docs/sandbox-verification.md` §3, a short note immediately above the wrappers table. It says the table's cells are the 2026-10-14 record taken against the `Bash(…)` form, and that P1, P3, R0–R4, C1, C2, K2, L1 and L2 are owed a re-run on a profile carrying the `bash <main>/scripts/<wrapper>.sh:*` form. Give the reason for C1, C2 and K2: the main wrapper they ran through now runs unsandboxed. Do not edit any row's cells.

**Verification:**

- Re-run scope register derivation entry A (story index → `## Scope register`). Every hit inside `docs/cli.md`, `ARCHITECTURE.md` and `docs/sandbox-verification.md` is a register row, and the `change` rows owned by this task are edited.
- `git grep -n 'Bash(bash <repoRoot>' -- docs/cli.md` has no hit outside a sentence naming the `Bash(…)` form as the stale or non-matching one.
- `git diff docs/sandbox-verification.md` changes no table row's Observed or Verdict cell. Only row F3's Follow-up cell and the prose sites above change.
- Every adopter command added by this task, if any, sits in a fenced block on its own line.

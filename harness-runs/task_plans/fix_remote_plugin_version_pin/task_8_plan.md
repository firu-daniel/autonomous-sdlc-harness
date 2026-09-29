### Task 8 — Document `--upgrade-workflows` and the version warning in `docs/cli.md`

**Goal:** Make `docs/cli.md`, the CLI's reference, state the new `init` switch, the new re-run contract of the two workflows and `doctor`'s new warning, in words that match the code Tasks 1–3 shipped.

**Depends on:**

- **Task 2:** the `init` row `--upgrade-workflows`, whose summary is *"Re-render the two remote-execution workflows at this CLI's version, after a .bak, when harness-run.yml was rendered for another"*. Its behaviour:
  - replace-after-`.bak` only when the run workflow's `HARNESS_CLI_VERSION` differs from the CLI's version;
  - `harness-resume.yml` re-rendered with it, carrying its `- cron:` lines;
  - a second run changes nothing;
  - with `execution.target` not `github-actions`, a warning and no write;
  - the report names each `.bak` with `git diff --no-index <path>.bak <path>`.
- **Task 3:** `remote-execution` **warns** when `harness-run.yml` is pinned to a version other than the CLI running `doctor`, naming `npx autonomous-sdlc-harness@<version> init --upgrade-workflows` and the stay-put alternative `npx autonomous-sdlc-harness@<pin> doctor`. It records a note, not a finding, when no pin can be read. It is never a failure.

Read those two modules' final text before writing, and describe what they do, not what this file says.

### Targets

- `docs/cli.md` — the only file this task edits. The story index's `## Scope register` rows 7–9 are this task's.

**Work:**

- [ ] **§2 (`## 2. \`init\``), the flag table.** Add a `--upgrade-workflows` row right after `--plugin-root-entries`, matching `INIT_OPTIONS`' order. State:
  - what it replaces and when;
  - the `.bak`, and the cron carry;
  - what it leaves (the runner and the timeouts are repository variables; every other hand edit survives only in the `.bak`);
  - that it is idempotent, and that it writes no config key;
  - the adopter-facing route in `remote-execution.md` → `### Upgrading`.
- [ ] **§3, the re-run contract.** Rewrite the `harness-run.yml` row: its upgrade path is `init --upgrade-workflows`, which re-pins it after a `.bak` only when the pin differs, with `--force` as the blunt alternative that re-renders everything. Rewrite the `harness-resume.yml` row: it is re-rendered together with the run workflow, carrying its cron.
- [ ] **§7, the `remote-execution` / `remote-github` bullet.** Add the version warning to the list of what `remote-execution` warns on. Say why it is a warning and never a failure: the job installs exactly its pin, and staying on an older version is the adopter's choice. Name the note for an unreadable pin.

**Verification:**

- `git grep -n -e "is also what re-pins it" -- docs/cli.md` returns nothing: the old §3 wording is gone.
- The §2 row's summary agrees with the `--help` line that `node cli/dist/cli.js init --help` prints after `npm run build`. Read them side by side.
- The §7 text names the same command `upgradeWorkflowsCommand` produces in `cli/src/generators/githubWorkflows.ts`.

### Task 12 — Bring `docs/cli.md`'s `remote-execution`, `remote-github` and `forge` descriptions up to the new findings, and qualify `README.md`'s GitHub route

**Goal:** `docs/cli.md`'s description of `doctor` names every read, note and warning this branch added. A reader of that page can predict the report. `README.md`'s GitHub route no longer promises that any team member can work from GitHub alone.

**Depends on:** Tasks 6, 7 and 8, which ship the findings described here, and Task 10, whose `docs/github-issue-trigger.md` → `## 3.` the README links:
- **`remote-github` (Task 6).**
  - It reads `HARNESS_RUN_ACTORS` from the variable listing.
  - When the list is unset, it asks `gh api repos/{owner}/{repo}`, for the owner. A failed owner read is a *cannot tell* warning.
  - **Notes:** `*` (every writer); listed (the logins); unset with a `User` owner (that owner alone).
  - **Warnings:** an unset list with a non-`User` owner (nobody may act); `*` while `CLAUDE_CODE_OAUTH_TOKEN` is set.
- **`remote-github` (Task 7).**
  - When the token is set and the list is listed or owner-only, it asks `gh api repos/{owner}/{repo}/collaborators?per_page=100`.
  - It warns on writers the list does not admit, naming them and the edited-workflow risk.
  - A refused read is a note.
  - A full page with no writer beyond the list is a *cannot tell* warning.
- **`remote-execution` (Task 8).** It warns when the committed `harness-run.yml` lacks `vars.HARNESS_RUN_ACTORS`, naming `init --upgrade-workflows`.
- **`forge` (Task 8).** Where the trigger applies, it warns when `harness-trigger.yml` or `harness-control.yml` lacks it, naming `init --force`. Its worst grade stays `warn`.
- **The allow-list's default (story index `## Context`; documented by Task 10 in `docs/github-issue-trigger.md` → `## 3. Who can start a run`).** Unset admits the repository owner alone in a user-owned repository and nobody in an organisation-owned one; `*` admits every writer. The README links that section rather than restating the grammar.

**How this task's implementer reads the conventions.** This is the catch-all layer: read `.claude/context/conventions.md`, and `.claude/context/cli.md` for the checks described. Before writing, read `cli/src/doctor/checks.ts` → `REMOTE_GITHUB_CHECK`, `REMOTE_EXECUTION_CHECK` and `FORGE_CHECK` as Tasks 6–8 left them. Describe the shipped text, not this summary of it.

### Targets

- `docs/cli.md`: the `doctor` bullet that opens *"**`remote-execution` and `remote-github` both pass where `execution.target` is `local` or absent**"*, and the `forge` bullet after it (*"**`forge` never fails, and it is the key's reporter**"*).
- `README.md` → `### Working from GitHub`, the sentence *"a team member who uses only this route needs nothing local: no clone, no plugin and no `init`"*.

**Work:**

- [ ] **The `remote-execution` half.** Where the bullet lists what it **warns** on, add the old `harness-run.yml` copy: what it does, and the `--upgrade-workflows` route.
- [ ] **The `remote-github` half.**
  - Add the owner and collaborators reads to the list of what it asks, each with its condition.
  - Add the notes and the three warnings above to the grading prose.
  - State that secrets are still read by name only. The list's **value** is read, as the runner and trigger labels' values already are.
- [ ] **The `forge` bullet.** Add the old trigger and control copy warning, with the `init --force` route.
- [ ] **`README.md` → `### Working from GitHub`.** Make the team member one the allow-list admits: by default only the repository owner may start or work a run from GitHub, and the maintainer names anyone else in `HARNESS_RUN_ACTORS`. Link [`docs/github-issue-trigger.md`](docs/github-issue-trigger.md#3-who-can-start-a-run) for the list. Keep the rest of the sentence: such a member still needs nothing local.

**Verification:**

- Each finding named here appears in `checks.ts` as Tasks 6–8 shipped it. Check by grepping `checks.ts` for `RUN_ACTORS_VARIABLE` and reading each use against this prose.
- Re-run the scope register's derivation entry 1, the widened command with the `Run workflow` and `team member` patterns. The `docs/cli.md` hit is the one bullet this task changed (row 19), and the `README.md` hit is the `### Working from GitHub` sentence this task changed (row 26). No hit in either file falls outside the register.
- The README's new link resolves: `grep -n '^## 3. Who can start a run' docs/github-issue-trigger.md` finds the heading.

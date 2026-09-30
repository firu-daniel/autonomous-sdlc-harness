### Task 9 — Document the release steps, the catalogue version and the Gate 12 observation in `docs/development.md`

**Goal:** Write down where releases are documented, which today is nowhere in the tree. Every release creates the tag the job installs from, before anyone can render a workflow for that version. This task also states why `.claude-plugin/marketplace.json` → `metadata.version` is not a release number, and adds the Gate 12 observation that the release carrying this fix must record.

**Depends on:**

- **Task 4:** the job clones `autonomous-sdlc-harness--v<version>` of the marketplace source named in the committed `.claude/settings.json` into `$RUNNER_TEMP/harness-marketplace`, adds it with `claude plugin marketplace add ./harness-marketplace`, and refuses on a missing tag or a mismatched version. It cites this section as "docs/development.md, section 7", and **this task creates that anchor as `## 7. Releasing`, spelled exactly so.**
- **Task 5:** `bash scripts/tag-release.sh <version> [--dry-run]`.
  - It tags the oldest commit on `origin/main`'s first-parent line whose `plugin/.claude-plugin/plugin.json` carries `<version>`. The tag is annotated, with the message `autonomous-sdlc-harness <version>`.
  - It pushes the tag, and only when stdin is a terminal.
  - It exits 0 when it tagged or the tag already exists, 1 when it refused or failed, and 2 on bad usage.
  - It refuses a version never published to `main`, which is 0.3.0's case.
- **Task 2:** `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`.

### Targets

- `docs/development.md` — the only file this task edits. The story index's `## Scope register` rows 10–11 are this task's.

**Work:**

- [ ] **New `## 7. Releasing`, after `## 6.`.** The steps, in order:
  1. The version bump pull request onto `dev`. The files are those the 0.4.2 bump touched (`git show --stat 729af00`): `cli/package.json`, `package.json`, `package-lock.json` and `plugin/.claude-plugin/plugin.json`.
  2. The publication pull request onto `main`, merged with **Rebase and merge** (`scripts/publish-main.sh` → `MERGE IT WITH "REBASE AND MERGE"`).
  3. `bash scripts/tag-release.sh <version>`, run from a checkout of `dev` at a terminal. Give it its own fenced block, and precede it with a fenced `--dry-run` form.
  4. The npm publication. State it only as far as a source in the tree states it, and do not invent a command. What this section must say is that the tag comes **before** it: a workflow rendered by the new CLI clones that tag, and a missing one makes it refuse.

  Then state:
  - the tag's shape, and that the maintainer created the first one (`autonomous-sdlc-harness--v0.1.0`) by hand on the initial commit;
  - why the push needs a terminal;
  - the backfill decision: 0.2.0, 0.4.0, 0.4.1 and 0.4.2 are backfilled with the same script, for the record. No workflow rendered before the fix reads a tag. 0.3.0 cannot be backfilled, because it was bumped on `dev` (`908d822`) and never published to `main` as its own commit, and the script refuses it.
- [ ] **§3, the bullet "The marketplace entry carries no `version`."** Extend it: `.claude-plugin/marketplace.json` → `metadata.version` is the marketplace catalogue's own version. It moves when the catalogue's plugin list or an entry's source changes, which has not happened since `0.1.0`, and it is not a release number. `plugin/.claude-plugin/plugin.json` is the release number, and the release tag (§7) names it.
- [ ] **§5, Gate 12.** In the gate's opening, change "Eleven observations" to "Twelve observations". After observation (xi), add **(xii) A job rendered for the previous version, and the upgrade**, with pass conditions and what to record:
  - A workflow rendered by the previous release refuses in `Install the pinned plugin`. Record its `::error::` line exactly.
  - `npx autonomous-sdlc-harness@<version> init --upgrade-workflows` re-renders both workflows: the pins are `<version>`, the cron is carried, and there is a `.bak` of each. The committed and pushed result's next job clones `autonomous-sdlc-harness--v<version>`, passes the check and runs. Record `claude plugin list --json`'s version.
  - Record whether that job's session `init` record names the plugin path under `$RUNNER_TEMP/harness-marketplace/plugin`. This settles `docs/remote-execution.md` §6's same-name marketplace row.
  - On the release after `<version>`, a job still rendered for `<version>` installs `<version>` while `main` carries the newer one, and runs.
- [ ] **The header's `Who reads this:`** gains releasing.

**Verification:**

- `git grep -n -e "Eleven observations" -- docs/development.md` returns nothing, and the observation list runs (i)–(xii).
- Every command in `## 7. Releasing` sits alone in its own fenced block (the ledger's adopter-documentation lesson).
- The script usage in §7 matches `scripts/tag-release.sh`'s own `Usage:` and `Exit:` lines. Read them side by side.
- The heading reads exactly `## 7. Releasing`, the anchor Task 4's header cites.

**Deviations from plan:**

- §7 step 1 cites the bump commit `729af00` rather than the inline `git show --stat 729af00`: the verification bullet requires every command in §7 to sit in its own fenced block, and that command is provenance, not a release step.
- §7 step 4 names `npm publish --workspace cli` in its own fenced block, quoted from `cli/README.md` → **No lockfile of its own.**, the one source in the tree that states a publish command; the section says no file states a release procedure for it.
- The backfill is stated as a decision ("The decision is to backfill …"), because only `autonomous-sdlc-harness--v0.1.0` exists among the local tags and the backfill runs are a maintainer's terminal action.
- Gate 12's "What still owes a first recording" line gains (xii), so the owed-recording list stays complete after the observation is added.

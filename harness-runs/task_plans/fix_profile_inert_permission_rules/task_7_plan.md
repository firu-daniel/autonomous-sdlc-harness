### Task 7 — Restate the profile's file-tool rules and wrapper forms in `docs/cli.md`, `docs/watcher.md` and `docs/development.md`

**Goal:** The three developer documents that describe the generated profile should state what the code now does. That means `Edit` file-tool rules only, two wrapper forms in the base, the run copy's exact twin in the per-run copy, the launch check that accepts only those twins, and a `profile-write-protection` check that requires an `Edit` deny and ignores `Write`.

**Depends on:** Task 1, Task 2, Task 3 and Task 5. The facts restated here, each with its owner:

- **`fileToolDenyRules` is `Edit` only:** `file` → `Edit(/<p>)`, `directory` → `Edit(/<p>/**)`, `entry` → both (Task 1, `cli/src/generators/writeProtection.ts`).
- **The per-run copy appends twins.** For every base `permissions.allow` and `permissions.ask` entry starting `Bash(bash <MAIN_REPO>/<scripts_dir>/`, it appends the twin starting `Bash(bash <copy>/<scripts_dir>/`. `run_profile_check` refuses any other `allow`/`ask` append with *"appends a permissions.allow or permissions.ask entry that is not the run copy's twin of a base wrapper rule"* (Task 1, `cli/templates/scripts/autonomous-watcher.sh`).
- **`doctor` requires an `Edit` deny only**, and never reports a `Write` rule (Task 2).
- **The base has no `Write` allow and no sibling-glob wrapper row** (Task 3).
- **The script-allowlist guard vouches only for its judged checkout** (Task 5).

### Targets

- `docs/cli.md`
- `docs/watcher.md`
- `docs/development.md`: the `$HOME` paragraph only.

**Work:**

- [ ] **`docs/cli.md`.**
  - *"Every wrapper is allow-listed in three forms, not one"*: two forms in the base, plus the run copy's exact form in the per-run copy, with the reason. A `*` before the trailing `:*` is a literal prefix, and the space-star spelling would cross `/` and stop matching a bare call (`docs/sandbox-verification.md` F4).
  - *"Everything that runs outside the sandbox is write-protected on both sides"*: *"an `Edit` deny rule"*, and the checkout-wide *"`Edit` allow"*. Add a clause saying `Edit` rules cover the `Write` tool and a `Write` path rule is never consulted.
  - *"Each run adds its own copy's paths by exact path, in a per-run profile"*: the copy also gets its wrapper twins in `allow` and `ask`, and the `Edit` rules.
  - Residual 2: *"the `Edit` deny rules carry the same globs"*.
  - The `profile-write-protection` bullet: *"an `Edit` deny rule"*. A leftover `Write` rule is neither required nor reported. The stale-entry clause *"as `Edit` / `Write` rules"* becomes *"as `Edit` rules"*.
- [ ] **`docs/watcher.md`.**
  - *"Why only the `yes` rows carry a profile entry"*: *"in the three literal forms a caller may spell them"* becomes two forms in the base plus the per-run copy's exact twin.
  - **What it adds.**: the `Edit` rules, plus a new bullet for the wrapper twins in `permissions.allow` and `permissions.ask`, where the `ask` twins keep a run copy's deploy asked about. The last bullet's *"sibling-glob `Edit` / `Write` allow"* becomes *"sibling-glob `Edit` allow"*.
  - **The launch check.**: a new bullet saying every appended `allow`/`ask` entry must be a twin, and that a job-mode check accepts none.
- [ ] **`docs/development.md`.** In the paragraph opening *"The `$HOME` half is a different matter"*, *"every file glob and every wrapper allow entry, plus the sibling-worktree pattern beside each"* becomes *"every file glob and every wrapper allow entry, plus the sibling-worktree pattern beside each file glob"*. Leave the roadmap item 6 narrative unchanged, as the story index's register row 9 states.

**Verification:**

- Run the command below from the checkout root. Every remaining hit must be a sentence about what an earlier release wrote. None may describe the current profile.

  ```
  git grep -nE 'Edit ?/ ?`?Write|Edit` and (a )?`Write|three (literal )?forms|sibling-worktree twin' -- docs/cli.md docs/watcher.md
  ```
- Each restated fact matches its owner, read in the tree rather than from this file: `fileToolDenyRules`, `run_profile_render`, `run_profile_check`, `PROFILE_WRITE_PROTECTION_CHECK`, and the template's `permissions` lists.

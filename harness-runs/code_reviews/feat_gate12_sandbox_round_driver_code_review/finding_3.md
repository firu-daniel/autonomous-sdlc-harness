### 3. `plant` exits 2, documented as "nothing created", after it has pushed and dispatched other arms

**File:** `scripts/lib/gate12-sandbox-round/plant.sh` (`g12_plant_arm`): "g12_exit_raise 2"

The exit contract is stated in three places:
- `scripts/gate12-sandbox-round.sh`'s header: *"2 a preflight refusal, nothing created"*;
- the same file's `usage` text: *"2 a preflight refusal, nothing created;"*;
- `docs/development.md` → Gate 12 round step 6's **Steps 6, 7 and 8 have a driver** paragraph: *"2 on a refusal before anything is created"*.

`g12_plant_arm` raises 2 in two cases that come *after* things were created:
- an arm already recorded (`… is already planted as …; run teardown before planting it again`);
- an arm `g12_plant_files` refuses, such as JS1 `settings` when the default branch carries no `.claude/settings.json`.

By then `g12_state_init` has written the state file. In a `plant` with no `--row`, every arm walked before the refused one has also been recorded, pushed to origin and dispatched. The operator reads exit 2 as "nothing was created" and may skip `teardown` or re-plant, while branches and jobs from this same invocation are live. Each one's `planted <row> <arm> <branch> run <id>` line on stdout contradicts the exit status.

`cli/test/gate12-sandbox-round-plant.test.mjs` asserts the re-plant refusal's status 2, so keep the code and correct the contract text.

**Fix:** reword the exit-2 description in all three places to the same meaning:

- `scripts/gate12-sandbox-round.sh` header, in the `# Exit` block:
  `#   2 a refusal: by the preflight, with nothing created; or of one plant arm, which alone is not created`
- `scripts/gate12-sandbox-round.sh` `usage` text:
  `2 a refusal: by the preflight, nothing created; or of one plant arm, which alone is not created;`
- `docs/development.md`, in the sentence *"Its exit status is 0 when nothing failed, …"*, replace *"2 on a refusal before anything is created"* with:
  *"2 on a refusal — by the preflight, before anything is created, or of one `plant` arm, which alone is not created, while the arms its `planted` lines name were"*.

Leave `g12_plant_arm`'s codes unchanged. None of the `cli/test/gate12-sandbox-round-*.test.mjs` suites matches the old wording (*"nothing created"*, *"before anything is created"*), so no test changes. The fix runs no test.

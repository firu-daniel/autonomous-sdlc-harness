### 1. Take the pause-note token file's name from `plants.sh` instead of retyping it in `grade-state.sh`

**Severity:** Must Fix

**Site anchor:**
- `scripts/lib/gate12-sandbox-round/grade-state.sh`, the new `G12_SB2PN_PLANT_NAMES` assignment and the comment above it: *"The token file's name is a literal copy of plants.sh -> g12_plant_sb2's file=gate12-sb2-pause-token.txt."*
- The owner: `scripts/lib/gate12-sandbox-round/plants.sh` → `g12_plant_sb2`, the case arm `pause-note) key=SB2_PAUSE_NOTE file=gate12-sb2-pause-token.txt ;;`.

**Problem.** The refusal rule that this branch adds decides whether a parked question "names the plant". It matches the question against a list that includes the token file's name, `gate12-sb2-pause-token.txt`, retyped as a literal. That value already has an owner. `plants.sh` → `g12_plant_sb2` sets it when it commits the token file. Both libraries are sourced into the same shell by `scripts/gate12-sandbox-round.sh`, in a fixed order (`core.sh preflight.sh state.sh plant.sh plants.sh … grade-plant.sh grade-state.sh …`). So `plants.sh` is loaded before `grade-state.sh` and can supply the value. The copy is not needed.

`.claude/context/conventions.md` governs this case:
- `## Configuration is the source of truth, and it is read at run time` → *"The shared constants have owners, and a value is imported from its owner rather than retyped"*.
- `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."* That section's own worked example is copies that drifted with no compile error and no test.

The comment that names the copy does not license it. The conventions accept a declared mirror only where the consumer cannot import, such as a shipped template mirroring a `cli/src` constant, and only when the owner's header declares it. Neither holds here. If `plants.sh` renames the token file, the grader keeps matching the old name with no error. The fail-safe direction limits the damage to a wrong `not run`, but the rule is still enforced against a stale copy.

**Fix.**
1. In `scripts/lib/gate12-sandbox-round/plants.sh`, declare a file-level constant next to the SB2 plant code, for example `G12_SB2PN_TOKEN_FILE="gate12-sb2-pause-token.txt"`. Change `g12_plant_sb2`'s `pause-note)` case arm to `file=$G12_SB2PN_TOKEN_FILE`.
2. In `scripts/lib/gate12-sandbox-round/grade-state.sh`, replace the literal third line of `G12_SB2PN_PLANT_NAMES` with `$G12_SB2PN_TOKEN_FILE`. Replace the "literal copy" comment with one that names the owner, for example *"The token file's name is plants.sh's G12_SB2PN_TOKEN_FILE, sourced before this file."*
3. Change no behaviour. The list's three entries and their order stay as they are, and every `g12_arm_set` string is unchanged.
4. Optional, same edit: `cli/test/gate12-sandbox-round-grade.test.mjs` already reads `G12_JS4_MARKER` out of `plants.sh` (its `PLANTS` constant). Its header says canned strings are read from the shipped file "wherever a fixed substring can be extracted". The link-target literal `'gate12-sb2-pause-token.txt'` in the case *"parked on the refusal with PAUSE_PROGRESS.md a link is fail"* may read the new constant the same way. That case asserts on the link, not on the name, so this step is not required.

**Deviations from plan:** The fix list did not name `cli/test/gate12-sandbox-round-plant.test.mjs`, but the edit required it. That test read the token file's name by matching `file=(\S+)` in `g12_plant_sb2`'s `pause-note)` case arm. After Fix 1 the arm reads `file=$G12_SB2PN_TOKEN_FILE`, so the match would capture the variable reference instead of the name. The test now asserts that the arm reads `$G12_SB2PN_TOKEN_FILE` and takes the name from the `G12_SB2PN_TOKEN_FILE='…'` assignment. Optional Fix 4 was taken: `cli/test/gate12-sandbox-round-grade.test.mjs` now extracts `G12_SB2PN_TOKEN_FILE` out of `plants.sh`, and its header list names it. Both files sit under `cli/`. They were edited on this catch-all dispatch because the finding scopes them to this unit.

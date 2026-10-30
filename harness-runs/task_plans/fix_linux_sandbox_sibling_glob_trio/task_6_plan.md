### Task 6 — Record the glob finding, the re-rooting and the owed re-take with AP6 in `docs/sandbox-verification.md`

**Goal:** Make the document of record say:

- what the 2026-10-30 re-take established about a `denyWrite` glob on Linux;
- what this branch changed in response;
- what is now owed, before merge, to show that the change works.

Every Linux statement rests on a dated measurement with its Claude Code and bubblewrap versions, or is marked predicted or owed (`.claude/context/conventions.md` → `## Documents of record`, the first bullet).

**Depends on:**

- **Task 2**, the behaviour recorded. On a bubblewrap host the per-run copy takes out of `sandbox.filesystem.denyWrite` the base's sibling-glob entries for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. That set is `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_glob_drops`. In their place it adds an exact entry for each of those paths in every **other** sibling directory whose `.git` is a real directory and in which the path's parent exists (`run_profile_entries`). The run copy is excluded by identity, and every `Edit` rule stays. `run_profile_check` accepts exactly that drop. The manifest lists every absent exact entry plus every absent path each remaining glob yields at launch (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_profile_deny_paths`).
- **Task 5**, the instrument. `scripts/sandbox-absent-path-check.sh` reads a sibling clone named by `SIB`, default `<main>-sbx_sibling`, when the maintainer has made one before the probe starts. It inspects every glob expansion and that sibling's trio, writes the watcher's manifest, and after `sweep` records `git status (sibling)`.

**Facts this task may write as measured, and nothing else Linux:**

- **AP2**, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0: the base's sibling-glob trio entries mounted `/null` placeholders at the clone's absent `commondir` and `http-alternates`, and left them on disk after D.
- **GW1**, 2026-10-29: a new file under an existing directory only a `*` entry covered was written.
- **GW2**, 2026-10-29: an absent path only a `*` entry covered met a placeholder.

Everything about the re-rooting's effect is **predicted** until AP1–AP6 are re-taken.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `## Documents of record` decides it: a dated Observed cell is a record and is never rewritten. A deferral cites a numbered roadmap item.

### Targets

- `docs/sandbox-verification.md`, in these sections:
  - §5 F9's follow-up cell;
  - §5 *The route's re-take (owed)*: its lead paragraph, the AP2, AP3 and AP5 Expected cells, a new AP6 row, *The decision rule*, and the closing *"2026-10-30: AP1–AP5 are measured"* paragraph;
  - §6's point *"How the Linux sandbox treats a `denyWrite` entry containing `*`"*;
  - §0 → **Why `config.worktree` differed: unknown**;
  - §8 `CS1 (Linux)`'s Expected cell, and §8 GW1's Expected cell.

**Work:**

- [ ] **§5 F9's follow-up cell.** After the existing *"AP1–AP5 … taken on Linux on 2026-10-30"* sentence, add `fix_linux_sandbox_sibling_glob_trio`'s change, in the cell's own bolded-label style: **The sibling-glob trio:** on a bubblewrap host the per-run copy also leaves out the base's sibling-glob `denyWrite` entries for the trio, re-roots them at every other sibling by exact path, and the manifest records each remaining glob's absent paths. Cite `run_profile_glob_drops`, `run_profile_entries` and `hr_profile_deny_paths`. Close with *"Owed: AP1–AP6 re-taken on this branch's head, before merge."* Leave every earlier sentence of the cell as it is.
- [ ] **§5 *The route's re-take (owed)*.**
  - Lead paragraph: AP1–AP6 are owed again on `fix_linux_sandbox_sibling_glob_trio`'s head, before merge. Add the step that the maintainer creates the sibling clone before the probe starts, citing `docs/development.md` → *The absent-path check, by hand.*
  - Expected cells: AP2's gains *"and the per-run profile carries none of the base's three sibling-glob trio entries"*. AP3's is unchanged in substance. AP5's gains *"the sibling's exact trio entries included"*.
  - Each 2026-10-30 Observed and Verdict cell stays as written. A row's re-take is recorded later, beside it.
  - New row **AP6**, owed. **Check:** the sibling clone's absent trio and its absent paths under the remaining globs, read inside a sandboxed call in A and B, outside after every phase, and after `sweep`. **Expected:** each reads as a placeholder inside the sandbox; each is absent outside after A, B and C; after D every leftover at those paths is in the manifest and is removed by `sweep`; `git status (sibling)` exits 0 after `sweep`. **Observed** and **Verdict**: `not run — owed`.
  - *The decision rule*: the re-take is the control run AP2 lacked, because no `denyWrite` entry of the per-run profile names the clone's trio. If `config.worktree` still appears, its source is not the profile, and AP2's row says so. That verdict is a proposal to the maintainer, and the question stays with the upstream report's third ask.
  - The closing paragraph: add one sentence that the section is owed again for this branch.
- [ ] **§6's glob point.** It reads *"**not run.**"* Replace that verdict with **measured, in part.** AP2, on 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0: a `denyWrite` entry containing `*` is expanded against the directories that exist when the sandbox starts, and a placeholder is mounted at each absent path it yields. GW1 and GW2, on 2026-10-29, Claude Code 2.1.312: a new file under an existing directory the entry matched was written, and an absent path met a placeholder.
  - Say what is still unmeasured: whether an existing **file** it matches is mounted read-only, and whether a sibling created mid-session is covered.
  - Replace the sentence *"No Linux or WSL2 host with `bubblewrap` and `socat` and a signed-in Claude Code was used."* too. In the next sentence, change only the words *"for the same reason"*, to *"as this point's own verdict was before 2026-10-29"*, so it no longer leans on the removed sentence.
  - Replace the point's last two sentences, which say the absent-path check *"left the globs out, so it measures nothing about the glob treatment"*, with the measured statement above.
  - Keep every other sentence of the point: the other `not run` items, their owed legs and the container note.
- [ ] **§0 → *Why `config.worktree` differed: unknown*.** Append three sentences:
  - on 2026-10-30 (§5 AP2) it again appeared at session A's start as a `-rw-r--r--` real file, mounted read-only over itself inside the sandbox;
  - the only profile entry naming it then was the sibling glob;
  - the owed re-take, with no entry naming it, is the control that tells the profile apart from Claude Code's own account.
- [ ] **§8 `CS1 (Linux)` and GW1, Expected cells.**
  - `CS1 (Linux)`: add that, since this branch, the base's sibling-glob trio entries are absent from a bubblewrap host's per-run copy and re-rooted at other siblings (predicted, not measured by CS1).
  - GW1: its quotation *"the generated profile's `_README` states the residual, that the Linux sandbox may skip one, or expand it…"* becomes past tense, *"stated, until `fix_linux_sandbox_sibling_glob_trio`, …"*, so the cell no longer claims what the `_README` says now.

**Verification:**

- `grep -n 'AP6' docs/sandbox-verification.md` finds the new row and its mentions in the lead paragraph and F9's cell, and nothing else.
- `git diff -U0 -- docs/sandbox-verification.md` changes no line inside a cell that carries a `2026-10-30` or `2026-10-29` reading, other than F9's follow-up cell, the AP Expected cells, `CS1 (Linux)`'s and GW1's Expected cells, and the §6 point. Each change there adds a clause or replaces only the sentences named above.
- `grep -nE 'not run\.\*\* No Linux' docs/sandbox-verification.md` prints nothing.

**Deviations from plan:**

- §6 glob point: the measured AP2 / GW1 / GW2 statement and the still-unmeasured clause are written once, in place of the point's last two sentences. The removed *"No Linux or WSL2 host…"* sentence is replaced by a one-sentence lead naming the two runs that measured it, not by a second copy of the statement.
- §5 closing paragraph: the added sentence names the branch without the token `AP6`, so the first **Verification:** grep matches only the AP6 row, the lead paragraph and F9's cell.

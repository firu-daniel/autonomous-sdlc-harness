### Task 5 — Re-copy the intake README template into this repository's own run-artifact tree and run the full gate suite

**Goal:** Keep this repository's own init-written `harness-runs/improvement_observations/README.md` byte-identical to the template it was written from, now that Task 1 has changed that template, and close the branch with the full gate suite showing no failure beyond the recorded baseline.

**Depends on:** Task 1, which adds to `cli/templates/state-dir/improvement_observations/README.md` one paragraph stating that every path an entry names is repo-relative and that the run checks the file for machine paths before committing it, citing `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## The entry format` and → `## Commit mechanics`. This task copies that file; it writes no text of its own into it.

**Why a copy and not an edit.** This repository has adopted its own harness, so `harness-runs/` at this root is `init`'s output here (`.claude/context/conventions.md` → `## Documents of record`). The two files are byte-identical on this branch's base; `cli/src/generators/stateDir.ts` writes a state-directory README `create-if-absent`, and `--force` rewrites it from the template. A hand-worded copy would diverge from what `init --force` writes, so the copy is the template's bytes and nothing else. **This is the catch-all task and ships last** because it mirrors what the `cli` task built and grades what every earlier task built.

### Targets

- `harness-runs/improvement_observations/README.md`

**Work:**

- [ ] Replace the whole content of `harness-runs/improvement_observations/README.md` with the content of `cli/templates/state-dir/improvement_observations/README.md`, byte for byte. Touch no other file under `harness-runs/improvement_observations/` — the intake files there are out of scope (task prompt: *"Rewriting existing observations files. `dev` already has them clean."*).
- [ ] Run `bash scripts/run-gates.sh` once, without a pipe, and compare its failing set against the baseline.

**Verification:**

- `git diff --no-index --exit-code cli/templates/state-dir/improvement_observations/README.md harness-runs/improvement_observations/README.md` exits 0.
- `git diff --name-only dev...HEAD -- harness-runs/improvement_observations/` lists `harness-runs/improvement_observations/README.md` and nothing else.
  - **Deviations from plan:** `git diff --name-only dev...HEAD` reads committed history, so before the commit it lists nothing; the implementer ran `git diff --name-only dev -- harness-runs/improvement_observations/` (working tree against `dev`) instead, which listed `harness-runs/improvement_observations/README.md` alone. The `dev...HEAD` form holds only once the committer has landed the file.
- `bash scripts/run-gates.sh` fails exactly the baseline the story index `## Context` records — `1a plugin manifest` and `11 docs-retrieval relevance floor` — and no other gate; `6a no machine paths` passes, which is also the check that no acceptance sample from Task 3 was left in the tree.

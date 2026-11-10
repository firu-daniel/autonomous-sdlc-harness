### Task 16 — Bring this repository's self-adopted script and state-dir copies to the template bytes

**Goal:** This repository has adopted its own harness. `scripts/` and `harness-runs/` at the root are `init`'s output here (`.claude/context/conventions.md` → `## Documents of record`). Make those copies match, byte for byte, what Tasks 1–5 and 7 changed in the templates. Local runs read this checkout's main-copy scripts, so the screen is reachable here once the profile is regenerated (story index → Manual setup required).

**Depends on:**
- **Tasks 1–4**, which own `cli/templates/scripts/prompt-injection-screen.sh`: mode `0755`, verbs `prescan`, `plan`, `park` and `verdict`.
- **Task 5**, which owns `cli/templates/scripts/lib/harness-run-lib.sh`, with `hr_ledger_phases` counting `P0` / `R0` when present.
- **Task 7**, which owns `cli/templates/state-dir/scratch/README.md` (the verdict directory) and `cli/templates/state-dir/clarifications/README.md` (the screen park).

This task changes none of those templates. Where a copy and its template differ after the copy, the template is right and the difference is reported, never resolved here.

**How this task's implementer reads the conventions.** This is the catch-all task, the `layers[]` row whose `path` is `"."`. Read every configured layer's conventions document: the copied files are `cli` templates.

### Targets

- `scripts/prompt-injection-screen.sh` (new, mode `0755`)
- `scripts/lib/harness-run-lib.sh`
- `harness-runs/scratch/README.md`
- `harness-runs/clarifications/README.md`

**Work:**

- [ ] **The script.** Create `scripts/prompt-injection-screen.sh` with the template's exact bytes, and give it mode `0755` (`chmod 755`).
- [ ] **The library.** Replace the contents of `scripts/lib/harness-run-lib.sh` with the template's exact bytes. It was byte-identical to its template when this plan was written (`cmp` printed nothing), so the copy carries over exactly Task 5's edit.
- [ ] **The two READMEs.** Replace the contents of `harness-runs/scratch/README.md` and `harness-runs/clarifications/README.md` with their `cli/templates/state-dir/` templates' exact bytes. Both were byte-identical to their templates when this plan was written.

**Verification:**

- **Byte identity.** Each of these prints nothing:
  - `cmp cli/templates/scripts/prompt-injection-screen.sh scripts/prompt-injection-screen.sh`
  - `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh`
  - `cmp cli/templates/state-dir/scratch/README.md harness-runs/scratch/README.md`
  - `cmp cli/templates/state-dir/clarifications/README.md harness-runs/clarifications/README.md`
- `test -x scripts/prompt-injection-screen.sh` exits 0.

- **Deviations from plan:**
  - The library was not byte-identical to its template when this task ran: `cmp` reported `differ: char 16960, line 251`, and `diff` showed exactly Task 5's hunks. Each README likewise differed by exactly Task 7's paragraph. All three were brought to the template with the file-edit tool; `cmp` against each template then printed nothing.
  - `cp` was refused by the permission profile (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`), so `scripts/prompt-injection-screen.sh` was written with the file-write tool from the template's bytes; `cmp cli/templates/scripts/prompt-injection-screen.sh scripts/prompt-injection-screen.sh` printed nothing.
  - `chmod 755 scripts/prompt-injection-screen.sh` was refused with the same message. The file is on disk as `-rw-r--r--` (`ls -l`), so `test -x` is not met. No other route was taken. The template itself is tracked as `100644` (`git ls-files -s cli/templates/scripts/prompt-injection-screen.sh`), as is `cli/templates/scripts/remote-run.sh`, while the self-adopted `scripts/remote-run.sh` is `100755`: the Goal's "mode `0755`" applies to the copy, not the template. Remedy: run `chmod 755 scripts/prompt-injection-screen.sh` before the commit, or stage with `git update-index --chmod=+x scripts/prompt-injection-screen.sh`.

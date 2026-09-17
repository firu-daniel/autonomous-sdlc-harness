### Task 9 — Add the `llms.txt` link check as `scripts/run-gates.sh` gate 6c and document it in `docs/development.md` §5

**Goal:** Add a check that fails when a link in `llms.txt` stops resolving on `main`. Put it where this repository's other path checks already live: as gate 6c of `scripts/run-gates.sh`, beside gate 6's self-containment checks, and documented under `docs/development.md` → `## 5. Verifying a change` → **Gate 6 — self-containment.**

**Depends on:** Task 8, which wrote `llms.txt` to this link contract. The check enforces exactly this, restated so this task's implementer does not guess:

1. Line 1 is exactly `# autonomous-sdlc-harness`.
2. A line starting `> ` appears before the first line starting `## `.
3. Every `](…)` target is `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/<path>`, where `<path>` is a tracked file, or `https://github.com/firu-daniel/autonomous-sdlc-harness/tree/main/<path>`, where `<path>` is a tracked directory.
4. No target carries `#` or `?`, and no target has any other form.
5. No `<path>` equals, or starts with `<entry>/` for, an entry of `scripts/publish-main.sh` → `removed_paths`.

Also depends on Task 3, which edited a different paragraph of `docs/development.md` (§6). This task touches only §5's gate 6.

**Why "tracked, minus `removed_paths`" is "resolves on `main`".** `publish-main.sh` builds `main`'s tree as `dev`'s tree with the `removed_paths` entries force-removed from the index. The only other change it makes is rewriting `.gitignore`'s content. So a path that is tracked here and matches no removed entry is present on the tree `publish-main.sh --dry-run` builds from this commit. Reading `removed_paths` out of `publish-main.sh` at run time, rather than copying the list, keeps one source.

### Targets

- `scripts/check-llms-txt.sh` (new) — the check.
- `scripts/run-gates.sh` — gate 6c.
- `docs/development.md` → `## 5. Verifying a change`, **Gate 6 — self-containment.**

**Work:**

- [ ] `scripts/check-llms-txt.sh`: `#!/usr/bin/env bash`, `set -uo pipefail`, and a header comment in the style of `run-gates.sh` / `publish-main.sh` stating what it checks, why the tracked-minus-removed test equals "on `main`", and its usage and exit contract. **Usage:** `check-llms-txt.sh [<file>]`, where `<file>` is repo-relative and defaults to `llms.txt`. **Exit:** `0` all checks pass; `1` one or more findings, each printed on stderr as `check-llms-txt: <target or line> — <reason>`, all findings reported rather than stopping at the first; `2` bad usage. Anchor to the repository root exactly as `run-gates.sh` does (`script_dir` from `${BASH_SOURCE[0]}`, then `git -C "$script_dir" rev-parse --show-toplevel`). Stay within bash 3.2: no `mapfile`, no associative arrays.
- [ ] Same script, the removed set. Read the lines between `removed_paths=(` and the next line that is only `)` in `scripts/publish-main.sh` with a `while read` loop, trimming whitespace. If that yields no entries, exit `1` naming `scripts/publish-main.sh`. Fail closed, so a refactor of that file cannot turn the check into a silent pass.
- [ ] Same script, per link. Extract every `](…)` target. For `blob/main/<path>`, require `git ls-files --error-unmatch -- "<path>"` to exit 0. For `tree/main/<path>`, require `git ls-files -- "<path>/"` to print at least one line. Refuse a `#` or `?`, any other URL form and any removed-path match. Also check contract clauses 1 and 2. Tracked means the index, so the gate grades the tree about to be committed.
- [ ] `scripts/run-gates.sh`: under `echo "== gate 6 — self-containment"`, after 6b, add `gate "6c llms.txt links resolve on main" bash scripts/check-llms-txt.sh`. It is graded by exit status through `gate`, not `gate_silent`. Change nothing else: the header's "five a process can run unattended" and the closing summary stay accurate, because gate 6 is still one of the five.
- [ ] `docs/development.md` §5, **Gate 6**: add a paragraph after the one on the root `./.claude` exclusion. It gives the third command, `bash scripts/check-llms-txt.sh`; says that unlike 6a and 6b it is read from its **exit status**; states contract clauses 1–5 in prose; explains why tracked-minus-`removed_paths` equals the tree `publish-main.sh --dry-run` builds; and notes that `scripts/run-gates.sh` runs it as 6c. Leave the gate's opening sentence and the `Both must print nothing` sentence about 6a and 6b true, adjusting only the words that would otherwise claim gate 6 has two commands. Add no `item <N>` phrase.

**Verification:**

- `bash scripts/check-llms-txt.sh` exits 0 against Task 8's `llms.txt`.
- **Planted failures, one scratch file each**, written under `harness-runs/scratch/` and deleted afterwards (never committed). Copy `llms.txt` and change one link in each copy, then run `bash scripts/check-llms-txt.sh harness-runs/scratch/<copy>` and read the result. Each of these must exit 1 with a line naming the planted target: a `blob/main/scripts/run-gates.sh` link (tracked here, removed on `main`); a `blob/main/docs/no-such-file.md` link; a `blob/main/README.md#quick-start` link; a `tree/main/README.md` link (a file used as a directory); and a first line changed to `# something-else`.
- The fail-closed branch, where no `removed_paths` entries are found, is verified by reading, not by planting. The branch must `exit 1` with a message naming `scripts/publish-main.sh`, and nothing after it may run. Planting would mean editing the real `publish-main.sh`, which this task must not do. Record in the final report that this branch was read, not run.
- `bash scripts/run-gates.sh` prints `ok    6c llms.txt links resolve on main` and no failure that `dev` did not already print.
- `bash -n scripts/check-llms-txt.sh` exits 0, and the file is committed with mode `100755` like its neighbours (`git ls-files -s scripts/check-llms-txt.sh`).
- After this branch merges to `dev`, `bash scripts/publish-main.sh --dry-run` lists `llms.txt` in its diff stat. That is a hand step after merge, because before merge `origin/dev` does not carry this branch.

**Deviations from plan:**

- `git ls-files --error-unmatch -- <path>` also exits 0 when `<path>` is a directory (measured with `plugin`), so a `blob/main/<path>` link additionally requires `git ls-files -- ":(literal)<path>/"` to print nothing. Both probes use `:(literal)` pathspecs so a `*` in a link is not a glob. A planted `blob/main/plugin` copy exits 1 with `'plugin' is a directory; a blob link needs a file`.
- A missing `<file>` exits 1 naming it, not 2: only an argument count above one is bad usage.
- Evidence downgrades: `chmod +x scripts/check-llms-txt.sh` required approval and was not run, so the working-tree file is mode `100644`; the `100755` verification is unmet and needs `git update-index --chmod=+x` or a chmod at commit time. `/bin/bash` (3.2) and `bash --version` also required approval, so bash 3.2 compatibility rests on reading (no `mapfile`, no associative arrays, the empty `removed` array is never expanded under `set -u`), and every run used the `bash` on PATH, version not observed. The fail-closed `removed_paths` branch was read, not run, as the plan specifies.
- `bash scripts/run-gates.sh` in this worktree prints `FAIL 6a`, whose single hit is `./.git:1:gitdir: …`: in a worktree `.git` is a file, which `--exclude-dir=.git` does not exclude. It comes from the checkout shape rather than this diff, and `ok    6c llms.txt links resolve on main` printed.

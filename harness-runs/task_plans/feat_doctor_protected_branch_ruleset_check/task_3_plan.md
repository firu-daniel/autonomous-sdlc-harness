### Task 3 — Name `branch-protection` in `doctor --help`'s `--check-github` text and in `cli/README.md`

**Goal:** Make what an operator reads before running `doctor` say that `--check-github` now also turns on the `branch-protection` check's reads, and that without the flag that check warns `not checked`.

**Depends on:** Task 2, which adds the check with id `branch-protection`. Under `--check-github`, with `forge` `github`, it asks GitHub read-only, through `gh`, whether each protected branch is covered by a ruleset or branch protection that blocks direct pushes, force pushes and deletion. It never fails: a default run, a non-GitHub forge and an unreadable answer each warn `not checked` / `cannot tell`. This task changes words only. The check's behaviour is Task 2's, and its end-to-end assertions are Task 4's (that suite asserts the help text this task writes).

### Targets

- `cli/src/commands/doctor.ts`: the `CHECK_GITHUB_FLAG` doc comment and the `DOCTOR_USAGE` lines about `--check-github`.
- `cli/README.md`: the `**What the five subcommands do.**` paragraph.

**Work:**

- [ ] `CHECK_GITHUB_FLAG`'s doc comment: replace *"it turns on the `remote-github` check's `gh` queries and changes no other check"* with a statement that it turns on the `gh` reads of `remote-github` and `branch-protection` and changes no other check. Keep the off-by-default reason.
- [ ] `DOCTOR_USAGE`:
  - **Keep the first line of the `--check-github` option byte-for-byte**, because `cli/test/doctor.test.mjs` matches `/--check-github\s+Ask GitHub, through gh, whether the remote-execution setup/`. Change only its continuation so it names both checks, for example *complete, inside the remote-github check, and whether each protected branch is protected there, inside branch-protection*.
  - In the `--check-github is off by default …` paragraph, add one sentence. With `forge` `github`, `branch-protection` reads each protected branch's ruleset rules, and its classic branch protection where those fall short. Every read is a GET. Without the flag that check warns that it did not ask. It never fails.
  - Keep every line within the block's existing width and plain ASCII (`.claude/context/conventions.md` → `## Output, logging and errors`, *"plain ASCII — no colour escapes, no emoji"*).
- [ ] `cli/README.md` → `**What the five subcommands do.**`: where the sentence ends *"and, offline, the remote-execution setup, which it also asks GitHub about under `--check-github`"*, extend it. Under the same flag, with `forge` `github`, `doctor` also asks whether GitHub protects each protected branch with a ruleset or branch protection. Use those GitHub terms (`harness-runs/lessons.md` → `## Adopter-facing documentation`, the rule on naming a surface with the term adopters arrive with). Change nothing else in the paragraph.

**Verification:**

- `bash scripts/typecheck.sh` exits zero.
- The `--check-github` option's first `DOCTOR_USAGE` line is unchanged: diff it against `HEAD`.
- Grep `cli/src/commands/doctor.ts` for `changes no other check` and confirm that every sentence carrying it names both `remote-github` and `branch-protection`.
- Grep the changed `DOCTOR_USAGE` lines for any non-ASCII byte and find none.

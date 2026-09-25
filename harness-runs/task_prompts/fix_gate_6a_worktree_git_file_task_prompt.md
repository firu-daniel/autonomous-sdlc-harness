`scripts/run-gates.sh` → gate `6a no machine paths` fails in every autonomous run, for a reason that is not a
machine path in the tree. Make it pass in a per-branch worktree without weakening what it guards.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.**

---

## The defect

Gate `6a` is `grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git`. In a
linked worktree `.git` is a **file**, not a directory — a one-line pointer `gitdir: <main checkout>/.git/worktrees/<name>`
— and `--exclude-dir` does not skip a file. So the gate prints `./.git:1:gitdir: …` and fails.

The watcher cuts every unattended run into a sibling worktree, so `commands.test` (`scripts/test.sh` →
`scripts/run-gates.sh`) exits 1 on every unit of every run. The `fix_line_number_citations_never_block` run
recorded it in `harness-runs/improvement_observations/fix_line_number_citations_never_block.md` →
`## The configured test gate cannot pass in a worktree run`: every implementer dispatch reported 11 of 12 gates
passing and had to diagnose the same failure again.

The false hit also hides real ones. The same run committed that observations file with the absolute
`gitdir:` line quoted in it — a genuine machine path — and nobody saw it as a second finding, because the gate
was already expected to fail.

## What to deliver

1. Gate `6a` excludes the worktree `.git` pointer file, and nothing else it did not exclude before. A real
   machine path anywhere else in the tree — including under `harness-runs/`, and including a file that quotes
   a `gitdir:` line — is still printed.
2. The gate is identical in a main checkout and in a worktree: same command, no branch on which kind of
   checkout it runs in, unless the plan shows that cannot be done.
3. `docs/development.md` → the gate 6 material under `## 5` states the exclusion in one clause, beside the
   existing exclusions.

## Establish, do not assume

- **Whether the grep honours `.gitignore`.** `.gitignore` ignores `.claude/settings.autonomous.json`, which by
  design names this checkout's absolute paths, and `docs/development.md` → *"The `$HOME` half is a different
  matter, and self-adoption breaches it."* still describes that conflict as left open. A recursive `grep` reads
  ignored files. Run the gate in the main checkout with the profile present and record what it prints. If
  the profile trips the gate, say so and state whether that paragraph is now stale. Do not change what the
  gate excludes for it on this branch: that is a separate decision.
- **Whether any test or doc quotes the gate's command line**, so a change to it is edited everywhere it is
  quoted.

## Out of scope

- Excluding `harness-runs/` from the gate. `publish-main.sh` removes it from `main`, but `dev` carries it and
  the gate's rule is that nothing in the tree names a location on the machine that wrote it.
- Any other gate.

## Acceptance

1. In a per-branch worktree whose tree names no machine path, `bash scripts/run-gates.sh` reports gate `6a`
   `ok`.
2. A file planted under `harness-runs/scratch/` (gitignored, so it is never committed) that contains `$HOME`
   makes gate `6a` fail and names that file. Remove it afterwards and record the output.
3. `bash scripts/run-gates.sh` prints no new failure in the main checkout.

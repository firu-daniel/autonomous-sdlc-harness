### Task 2 — Repoint `git-trust-file-guard.sh`'s residual citation in its header and its deny reason

**Goal:** Make the file-tool trio guard cite residual 12 where it will live, `docs/sandbox-record.md`, in both places it names it: its header comment and the `deny` reason it emits. The guard's decisions are unchanged. Only the citation inside the reason text changes.

**Depends on:** Task 1, by ship order only. The two tasks share no file. The contract consumed is the same one. Task 5 moves residual 12 into `docs/sandbox-record.md` → `## 6. The residuals` with its number unchanged. A shell comment or runtime string uses the short form `docs/sandbox-record.md residual 12`.

**Where this layer stops.** `docs/sandbox-verification.md` §5 row AP9 quotes the reason this guard emitted on the day it was measured, `… (docs/cli.md §6 residual 12)`. That quote is evidence and stays byte-identical (scope-register row 24). No task edits it. This task does **not** write the guard's re-measurement record: `docs/guard-verification.md` sits in the `general` layer, so **Task 7** owns it. Task 7 re-drives §2.6's T1–T17 on paired trees (`plugin/hooks` at the merge base and at the branch tip) and writes a dated re-drive line under `### 2.6 The file-tool trio guard`, in the form of the existing `fix_sibling_glob_traversal` line. The re-drive must show `moved-by-branch: none`. That is the result to be shown, not a reason to skip it, so this task changes no `case`, test or `deny`/`allow` branch, and Task 7 can show it.

### Targets

- `plugin/hooks/git-trust-file-guard.sh`: the header comment, and the `deny` call whose reason reads *"refusing $tool on $given$resolved: .git/commondir, .git/config.worktree and .git/objects/info/http-alternates redirect git to another repository or config; a run copy must never carry one written by a session (docs/cli.md §6 residual 12)"*.

**Work:**

- [ ] Header: replace *"(docs/cli.md §6 residual 12)"* with *"(docs/sandbox-record.md residual 12)"*, rewrapping only the lines the edit lengthens.
- [ ] `deny` reason: replace the trailing *"(docs/cli.md §6 residual 12)"* with *"(docs/sandbox-record.md residual 12)"*. Keep every other byte of the reason. The reason sits inside a double-quoted shell string, so the replacement adds no `$`, backtick or quote.

**Verification:**

- `git grep -nF "cli.md" -- plugin/hooks/git-trust-file-guard.sh` returns nothing.
- `git diff -- plugin/hooks/git-trust-file-guard.sh` changes exactly two lines (or the rewrapped header lines plus the reason line), and no `case`, test or `deny`/`allow` branch.
- Reproduce one trio refusal by hand from the guard's own `REPRO` block, against a throwaway `git init` fixture as `plugin/hooks/README.md` → `## Reproducing a decision by hand` describes: an `Edit` of `<repo>/.git/commondir`. The decision is still `deny`, and its `permissionDecisionReason` ends `(docs/sandbox-record.md residual 12)`.

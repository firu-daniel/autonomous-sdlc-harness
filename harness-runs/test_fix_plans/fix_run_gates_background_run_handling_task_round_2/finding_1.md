### 1. Gate 6b reports a file-less `.claude/` directory under the run-artifact tree

**Site anchor:** `scripts/run-gates.sh` — the `gate_silent "6b no template in the dot-namespace" \` call and the `find . -name '.claude' -type d` command under it (around line 151, a navigation hint only). Its hand-run mirror is `docs/development.md` → `## 5. Verifying a change` → **Gate 6 — self-containment.**, the fenced line `find . -name '.claude' -type d -not -path './examples/notes-app/.claude' -not -path './.claude'` (around line 368), and the paragraph opening `The second command is the one that is easy to breach by accident` (around line 375).

**Failing test:** none — run-gates (gate `6b no template in the dot-namespace`, run by `commands.test` through `scripts/run-gates.sh`)

**Failure, as the log reports it:**

```
== gate 6 — self-containment
  ok    6a no machine paths
  FAIL  6b no template in the dot-namespace (printed output, which is the finding)
        ./harness-runs/.claude
...
run-gates: 1 failed, 22 passed
  - 6b no template in the dot-namespace
FAIL: test (exit 1)
```

**Class:** new this round. Gate 6b passed in round 1 (`ok    6b no template in the dot-namespace`), and the one round-1 failure, gate `4 npm test`, passes in round 2. This is not a regression from round 1's code fixes: the commits since round 1 (`4a1c5c95`, `9d509bf7`) did not create this directory. It is a working-tree directory that appeared while the run was going.

**Diagnosis.** Gate 6b is graded by `gate_silent`: any output fails it. Its `find` prints every directory named `.claude` in the tree except `./.claude`, `./examples/notes-app/.claude` and anything under `./node_modules/`. In the current tree, `harness-runs/.claude/` exists and holds one thing, an empty directory `harness-runs/.claude/.cc-writes/`. Both were created at the same time, in the middle of this run. Neither directory contains a file, and git tracks files, not directories, so nothing in it is tracked or can ever be committed. The `.cc-writes` name matches the bookkeeping directory the agent runner's sandbox keeps in a `.claude/` folder. That means it was most likely written by the tooling running this flow, not by anything in this repository, and an unattended run that writes into `harness-runs/` can create it again on any later round.

The gate's purpose is stated in the comment above it and in `docs/development.md`: catch **a template committed** into the dot-namespace `init` generates. A `.claude/` directory with no file in it at any depth cannot hold a committed template. The gate fails on it only because `find -type d` grades whether a directory exists, not whether it has committable content. Deleting the directory by hand would turn this round green, but the next run that writes into the run-artifact tree would bring the failure back. So the fix belongs in the gate's selection rule, not in the working tree.

The fix must not weaken the gate. Every `.claude/` directory that holds a file, anywhere in the tree (including under `harness-runs/`, `cli/templates/` or any other directory), must still be printed. The fix must not exclude a path such as `./harness-runs/.claude`, because a template committed there would then pass silently.

**Concrete fix (layer `general`, files `scripts/run-gates.sh` and `docs/development.md`):**

- [ ] In `scripts/run-gates.sh`, replace the inline `find` that follows `gate_silent "6b no template in the dot-namespace" \` with a named function, in the same style as `machine_path_hits` just above it, and pass that function to `gate_silent`. The function keeps the existing discovery unchanged (`find . -name '.claude' -type d -not -path './examples/notes-app/.claude' -not -path './.claude' -not -path './node_modules/*'`). It prints a directory found that way **only if** a second `find` rooted at that directory, matching `-type f -o -type l` with `-print -quit`, prints something. The function must stay bash-3.2-safe and use only `find` (no `rm`, no `git`). It must read the discovered paths without word-splitting, for example `while IFS= read -r dir; do … done`, and print each qualifying path exactly as the first `find` printed it (e.g. `./cli/templates/.claude`), so a real breach reads the same as it does today.
- [ ] Extend the comment block above the 6b call. Keep the existing two-exclusions paragraph as it is and add a short paragraph stating three things. First, a `.claude/` directory holding no file or symlink at any depth is not printed, because git tracks files only, so such a directory can put nothing into a commit. Second, this is why an empty `.claude/.cc-writes/` that the agent runner's sandbox leaves under the run-artifact tree no longer fails the gate. Third, a `.claude/` holding any file is still printed wherever it sits, `harness-runs/` included.
- [ ] In `docs/development.md` → **Gate 6 — self-containment.**, update the second line of the fenced block so the hand-run command matches the gate. A form that runs as one pasted command is `find . -name '.claude' -type d -not -path './examples/notes-app/.claude' -not -path './.claude' -not -path './node_modules/*' -exec sh -c 'test -n "$(find "$1" \( -type f -o -type l \) -print -quit)" && printf "%s\n" "$1"' sh {} \;`. Any equivalent form works if it keeps the print-nothing-to-pass reading and prints only `.claude/` directories that contain a file or symlink. Then, in the paragraph beginning `The second command is the one that is easy to breach by accident`, add one or two sentences stating the file-content rule and why it holds (git tracks files, so a file-less `.claude/` cannot carry a template into a commit). Also state that the exact-path exclusions are unchanged, and that a `.claude/` holding a file is printed under `harness-runs/` as anywhere else. Do not describe `.cc-writes` there as a measured fact about the runner. If you mention it, call it the observed case that prompted the rule.
- [ ] Do not delete `harness-runs/.claude/`, and do not add `harness-runs/.claude` to `.gitignore` or to the gate's `-not -path` list. The gate change makes the directory harmless, and an exclusion by path would hide a real breach at that location.

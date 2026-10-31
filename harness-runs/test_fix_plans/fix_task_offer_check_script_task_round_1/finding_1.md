### 1. Remove the absolute machine path from `question_2.md` option (a)

**Site:** `harness-runs/clarifications/fix_task_offer_check_script/question_2.md`, the option bullet beginning `- **(a)** You set the bit by hand in the run copy` (line 25 is a navigation hint only). Grep-verified in the current tree.

**Failing test:** none — test (run-gates check `6a no machine paths`, implemented by `machine_path_hits` in `scripts/run-gates.sh`)

**Failure (from the log, machine paths rewritten):**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/clarifications/fix_task_offer_check_script/question_2.md:25:- **(a)** You set the bit by hand in the run copy `.`, before answering: `git update-index --chmod=+x scripts/task-offer-check.sh` (or `chmod +x` on the file; `core.filemode` is `true`). Leave it uncommitted. On resume the implementer finds the bit set and the committer records `100755` with the finding's checkbox.
```

In the log, the backticked run-copy path is this checkout's absolute root. It is shown above in its repo-relative form, `.`.

**Diagnosis:** New this round. `machine_path_hits` runs `grep -rn "$HOME" .` over the whole working tree. It skips only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`, and it does not skip git-ignored files. The park file `question_2.md` is git-ignored (`.gitignore` rule `harness-runs/clarifications/*`), but it is still in the tree. Option (a) of the park question names the run copy by its absolute path, which begins with the operator's home directory. A search of the current tree finds no other `$HOME` hit outside the excluded directories, so this one line is the whole failure. The park has already been answered (`answer_2.md` and the `answered` marker are present). Rewording the question's prose does not change the decision it recorded.

**Fix:** Edit `question_2.md` so that option (a) names the run copy without an absolute path. Replace the backticked absolute path in `in the run copy \`…\`, before answering` with a location-independent phrase, for example `in the run copy (this checkout's root, as \`git rev-parse --show-toplevel\` prints it), before answering`. Leave the rest of the bullet, and every other line of the file, unchanged. Do not touch `scripts/run-gates.sh`. Adding an exclusion for `harness-runs/clarifications` to the gate would weaken the check, which is not allowed.

- [ ] After the edit, `grep -F` for the home directory in `question_2.md` should print nothing.
- [ ] The file is git-ignored, so the edit puts no change in a commit. The fix exists only in the working tree that the gate scans.

# test_run_logs/

One `<branch>/<gate_key>_round_<gate_round>.log` per gate run, holding the full output of one run of the configured test command. `<branch>` is the branch name sanitized for use as a path; `<gate_key>` is `task` in the task flow and `review_<n>` in the user-review fix flow; `<gate_round>` counts the Run gates phase's runs for that key. Beside each log sit `<label>.running`, the in-flight run's PID, and `<label>.verdict`, the one line the run printed — `pass` or `fail <log path>`.

A log is written by the harness's test-suite wrapper, `run-test-suite.sh`, and by nothing else; the wrapper creates the `<branch>/` subdirectory itself. The orchestrator of the Run gates phase never reads a log — it reads the verdict line and hands a failing log's path on. The test fix-plan writer reads it, and on a later round reads the previous round's log too, to tell a regression the last fix introduced from a failure that persisted.

A log appears on each gate run and is **versioned per round, never overwritten across rounds**: each round runs under its own label, so round N's log is still there after round N+1 ran. Only a re-run of the same label — a resumed round — truncates that label's log. Nothing rotates or archives the directory.

Its contents are **machine-local and gitignored**: the directory is ignored by its contents rather than as a directory, and this README survives by an explicit negation, which makes it the only committed file here.

The mistake worth naming is treating a log as evidence a later reader can open. It never reaches a commit, because the machine paths it carries are what the self-containment gate refuses. A fix plan quotes **what the log showed**, with machine paths rewritten — paths under the checkout root made repo-relative, any other home-directory path replaced by `<home>` — because the fix plan is committed and a raw path would carry into it exactly what keeps the log itself out.

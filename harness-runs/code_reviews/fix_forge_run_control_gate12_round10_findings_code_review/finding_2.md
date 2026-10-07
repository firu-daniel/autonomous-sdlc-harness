### 2. Gate 12 (xv)(d) requires the `needs-agent:` log line but fetches no log

**Site:** `docs/development.md` → Gate 12 → (xv) → **(d) A comment command.**, the pass sentence opening "Passes when the reply names `HARNESS_RUN_ACTORS`; the job's `needs-agent:` line reads `no`".

**Problem.** This branch added a condition to leg (d)'s pass sentence: the job's `needs-agent:` line must read `no` and name the exact form `` `@sdlc-harness status` ``. That line is printed to the job's **log** by the `Decide whether the comment needs the agent` step. Leg (d) gives three commands: the comment, `gh issue view … --comments`, and the new step-conclusion query `gh run view <run id> … --json jobs --jq '.jobs[].steps[] | [.name, .conclusion] | @tsv'`. The query prints step names and conclusions only, never log lines. No command in leg (d) fetches the log, so an operator following the leg as written cannot check the condition. The next leg, (d′), checks the same kind of line and does carry the `gh run view <id> … --log` command.

**Fix.** In leg (d), insert this fenced block immediately before the existing `gh run view <run id> --repo <owner>/<scratch-repo> --json jobs …` block, using the same `<run id>` placeholder:

```
gh run view <run id> --repo <owner>/<scratch-repo> --log
```

Keep it as its own fenced block, one command per line.

### 5. Observation (xvi) gives `/autonomous-sdlc-harness:branch-prompt` inline in prose, against the branch's own fenced-block rule

**File:** `docs/development.md` (**(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** → **The drop.**): "so the task-plan writer parks, with `/autonomous-sdlc-harness:branch-prompt`".

**The problem.** The story index's `## Context` → **Cross-cutting rules, stated once.** says: "Every command the gate hands the maintainer sits in a fenced block, one command per line, and nothing is pasted inline in prose". It cites `harness-runs/lessons.md` → *Adopter-facing documentation*. In (xvi), the drop command is given inline in a sentence, while the answer command a few lines later (`/autonomous-sdlc-harness:branch-answer <branch>: <answer text>`) sits in its own fenced block. Observation (ii) does the same inline drop, but that is older text. The branch's own rule binds what this branch writes.

**Fix.** In **The drop.**, end the sentence at "…so the task-plan writer parks:" and give the command its own fenced block, with the `/autonomous-sdlc-harness:branch-prompt <task text>` placeholder spelled as shown:

````
In a `claude` session in the scratch repository, drop a small task that leaves one decision undecided — a limit it names without setting — so the task-plan writer parks:

```
/autonomous-sdlc-harness:branch-prompt <task text>
```

Then let the watcher dispatch it in one pass, as (ii) does:
````

Leave the following `autonomous-watcher.sh tick` / `gh run list` block unchanged. This is a documentation edit only, so no test runs for this fix.

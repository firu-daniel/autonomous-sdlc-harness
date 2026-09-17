### 5. The README's `branch-prompt` route is still an inline command in a sentence this branch rewrote

**File:** `README.md` (the paragraph under **E.** that opens "Two direct routes reach the same drop:") — "Two direct routes reach the same drop: `/autonomous-sdlc-harness:branch-prompt` itself, or a file named `<branch>_task_prompt.md` written into `<state_dir>/autonomous_inbox/`"

`harness-runs/lessons.md` → `## Adopter-facing documentation` holds this rule: *"Every command an adopter is meant to run sits in a fenced block, one command per line; never inline it, join two with prose, or cut its block when compacting a document."*

This sentence breaks it. `/autonomous-sdlc-harness:branch-prompt` is not a referent here. It is one of the two routes the README offers an adopter for starting a run, so the adopter is meant to run it. The branch respelled the command (it read `/branch-prompt` on `dev`) but left it inline, joined by prose to the other route. The paragraph just above it shows the right shape: the `daemon install` / `daemon start` lines sit in a fenced `bash` block.

There is a second problem. The inline form gives no argument, but `plugin/commands/branch-prompt.md` declares `argument-hint: <free-text task description>`. Its **Usage** paragraph says to keep typing the task description on the same line. An adopter who copies the bare inline spelling gets the command with no task.

Who gets it wrong: an adopter reading step E for a direct route. They copy the inline spelling, maybe into a terminal because nothing says it goes in a session, and submit it with no task description.

**Fix:** in `README.md`, replace the whole paragraph

> Two direct routes reach the same drop: `/autonomous-sdlc-harness:branch-prompt` itself, or a file named `<branch>_task_prompt.md` written into `<state_dir>/autonomous_inbox/` ([`docs/config.md`](docs/config.md) §3). The next poll pass acts on it, as [`docs/watcher.md`](docs/watcher.md) §1 describes.

with

````markdown
Two direct routes reach the same drop. The first is the command itself, typed into an interactive Claude Code session with the task description on the same line:

```
/autonomous-sdlc-harness:branch-prompt <task description>
```

The second is a file named `<branch>_task_prompt.md` written into `<state_dir>/autonomous_inbox/` ([`docs/config.md`](docs/config.md) §3). The next poll pass acts on either, as [`docs/watcher.md`](docs/watcher.md) §1 describes.
````

The outer four-backtick fence only delimits the snippet. Paste only what is inside it. The inner block is a plain ``` fence with no language tag, the same as the README's step 3 `harness-analyze` block.

- [ ] Replace the paragraph as above.
- [ ] Run `bash scripts/check-command-spelling.sh`. It should exit 0, since the new spelling carries the prefix.
- [ ] Run `bash scripts/check-llms-txt.sh`. It should exit 0, since `llms.txt` does not mirror this paragraph.

`docs/watcher.md` → `### The per-run profile` says what `watcher.log` carries when the per-run profile cannot be rendered or fails its check (`not launching '<branch>': <reason>`). It does not say what it carries when both pass, and a reader hunting for a "profile rendered" line finds none.

## Change

Add one sentence right after the paragraph that ends with the per-run profile's base-validity residual (the one starting "Claude Code silently ignores a `--settings` file…"). The sentence says:
- a render and a check that pass log nothing of their own;
- a run's `launching headless run for '<branch>'` line, with no `not launching '<branch>'` line before it, is the `watcher.log` record that both passed;
- the run-registry record's `run_profile` field names the rendered file.

Check each of the three claims against `scripts/autonomous-watcher.sh` (`spawn_engine`, `run_profile_render`, `run_profile_check`) before writing it, and keep the sentence true for the job mode and bubblewrap paths the same section describes.

## Done when

- The one sentence is in place, and nothing else in the document changes.

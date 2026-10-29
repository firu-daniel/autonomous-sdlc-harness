### 1. The registry header says every `failed` write clears `pid` in the same write, but `spawn_refused` still clears it in a second write

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`spawn_refused`): "registry_set \"$1\" status failed". The same edit goes in the byte-identical root copy, `scripts/autonomous-watcher.sh` (`spawn_refused`).

This branch rewrote the `pid` entry of the registry field list (the `# Registry helpers.` header block, starting "pid                 the launch subshell's pid, written by spawn_engine after"). It now says the pid is "cleared in the same write that sets `completed` or `failed`". Every terminal write the branch touched does that: `reconcile_stale_runs`, `classify_run_exit`'s two arms, the stall watchdog's two give-up arms and `fail_before_launch` each write `status failed pid ""` (or `status completed pid ""`) as one `registry_set` call. `spawn_refused` does not. It still makes two calls:

```bash
spawn_refused() {
  registry_set "$1" status failed
  registry_set "$1" pid ""
  notify failed "$1" "$2" "not launched: ${SPAWN_REFUSAL:-the launch was refused}"
}
```

Nothing breaks at run time. Every `spawn_refuse … return 1` in `spawn_engine` comes before the backgrounded subshell `) &`, so no session exists and no relaunch can land between the two writes. But the header is wrong about one site, and the story plan's second top risk calls the same-write form the safeguard against a clear landing after a relaunch. A maintainer who copies `spawn_refused` as the pattern for a new terminal write would be copying the form the header says this file does not use. (`launch_remote_run`'s `status failed` is not a counterexample: `hr_remote_record_init` has already written an empty `pid` on that remote record.)

**Fix:** put the two writes into one call in **both** copies, so that `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh` stay byte-identical:

```bash
spawn_refused() {
  registry_set "$1" status failed pid ""
  notify failed "$1" "$2" "not launched: ${SPAWN_REFUSAL:-the launch was refused}"
}
```

Leave the comment above `spawn_refused` ("no pid stays attached") as it is. It is still true. After the edit, confirm the two files are still identical with `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh`, run bare from the checkout root. This fix edits no test file, so it runs no test. The full suite runs in the Run gates phase.

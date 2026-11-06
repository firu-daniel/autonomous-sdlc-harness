Found while re-driving `docs/outer-loop-verification.md` §1.1 on a clone (its clone column, and the paragraph under its table).

## What happens

`commit-on-branch.sh --repo <clone>` gives a misleading message in two cases:
- the main checkout's `harness.config.json` cannot be read (invalid JSON, absent);
- a pre-1.5 `jq` is first on `PATH`.

It still refuses at exit 1 and moves no ref, so the outcome is safe. But the message is the clone trust check's:

```
commit-on-branch.sh: refusing to commit: '<clone>' is neither the main checkout <main> nor a worktree it lists: its .git is not a regular pointer file, and the run registry records no clone of <main> at that path
```

It should be the line the main-checkout and worktree targets print in the same two cases:

```
commit-on-branch.sh: cannot resolve '<main>/harness.config.json' — refusing to commit
  (no configuration there, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)
```

## Why

`hr_clone_target_check_var` (`cli/templates/scripts/lib/harness-run-lib.sh`) finds the registry through `hr_state_path <main> autonomous_logs/registry.json`, which reads `stateDir` from the configuration. With the configuration unreadable, that lookup fails, `kind` stays empty, and the function returns the "registry records no clone" refusal. The wrapper's own configuration check would have named the real cause, but it runs after the target check.

An operator reading the message would go looking at the registry or the clone, and both are fine.

## Expected

On the clone arm, a configuration that cannot be resolved should be reported as such: the same `cannot resolve '<main>/harness.config.json'` line and exit 1 the other two targets give. A registry that genuinely has no matching record should keep today's line.

There are two ways to get there:
- the clone arm distinguishes a failed `hr_state_path`, or a failed configuration read, from a missing record;
- the wrappers resolve the main checkout's configuration before the target check.

Check whether `push-branch.sh` and `refresh-branch.sh` have the same ordering. They share the target check, so they likely do.

## Repro

On an `init`-built fixture (`docs/outer-loop-verification.md` §0), cut a clone with `create-worktree.sh`, then do either of the following and call `bash <main>/<scripts_dir>/commit-on-branch.sh --repo <clone> <file> -- "probe"`:
- truncate `<main>/harness.config.json`;
- put a `jq` stand-in that answers `jq-1.4` first on `PATH`.

## Done when

- A `cli/test` case drives both causes against a clone and asserts the `cannot resolve` line, the exit 1 and no ref moved.
- A case with a readable configuration but no registry record still gets the registry line.
- `docs/outer-loop-verification.md` §1.1's clone cells for the two rows, and the sentence under the table about the clone message, are updated to match.

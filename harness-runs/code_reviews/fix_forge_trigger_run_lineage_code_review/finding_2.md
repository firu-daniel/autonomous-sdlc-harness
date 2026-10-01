### 2. Three texts say both trigger answers appear on every `remote-github` outcome, but the check returns before asking about the trigger when `gh` is not authenticated or cannot run

**Files:**
- `cli/src/doctor/checks.ts`, the doc comment above `REMOTE_GITHUB_CHECK`. Anchor quote: "both trigger answers positive is confirmed on **every** outcome, `fail` and `warn` included"
- `docs/github-issue-trigger.md` → `## Turning it on, in short` → **6. Check the setup.** Anchor quote: "Both answers appear in the `remote-github` check's report whatever else it reports, `pass`, `warn` or `fail`."
- `docs/cli.md`, the `remote-execution` and `remote-github` bullet. Anchor quote: "Both trigger answers appear on every `remote-github` outcome"

**The problem.** `REMOTE_GITHUB_CHECK.run` asks about the trigger only in its `if (forgeTriggerApplies(ctx.config))` block, which comes after the authentication probe and the run, secret, resume, variable and retention reads. Several outcomes return before that block and carry neither the trigger confirmation nor a trigger warning:

- `if (auth.answer.kind === 'unknown') return warn(…'whether gh is authenticated, so nothing further was asked')`
- `if (auth.answer.kind === 'refused') return fail(…'reports no usable login'…)`
- every `return fail(noSpawn)` (a `gh` that cannot be spawned)

So "on every outcome", "whatever else it reports" and "on `pass`, `warn` and `fail` alike" are each false for those outcomes. The code is correct. The three texts overstate it.

**Fix.** Replace the three claims as follows. No code changes.

1. `cli/src/doctor/checks.ts`, the doc comment bullet above `REMOTE_GITHUB_CHECK`. Replace the bullet that begins "both trigger answers positive is confirmed on **every** outcome" with:

   ```ts
    * - both trigger answers positive is confirmed on every outcome that reaches the trigger reads, `fail`
    *   and `warn` included, so an unrelated finding never hides it; either answer not positive is already
    *   among the warnings. An outcome returned before those reads — `gh` not runnable, no usable login,
    *   or no readable answer to the login probe — asks GitHub nothing about the trigger.
   ```

2. `docs/github-issue-trigger.md` → **6. Check the setup.** Replace the sentence "Both answers appear in the `remote-github` check's report whatever else it reports, `pass`, `warn` or `fail`." with:

   > Once `gh` is authenticated, both answers appear in the `remote-github` check's report whatever else it reports, `pass`, `warn` or `fail`. A `gh` that cannot run or reports no usable login stops that check before GitHub is asked about the trigger.

3. `docs/cli.md`, the `remote-execution` and `remote-github` bullet. Replace "Both trigger answers appear on every `remote-github` outcome — a confirmation when both are positive, on `pass`, `warn` and `fail` alike, so an unrelated finding never hides it, and otherwise among the warnings —" with:

   > Both trigger answers appear on every `remote-github` outcome that gets past the authentication probe — a confirmation when both are positive, on `pass`, `warn` and `fail` alike, so an unrelated finding never hides it, and otherwise among the warnings —

   Keep the rest of that sentence ("and under `--check-github` the `forge` line points at `remote-github` for them rather than at the flag.") unchanged.

`npm run build` from `cli/` (the typecheck) covers the comment edit. No test file is touched, so this fix runs no test.

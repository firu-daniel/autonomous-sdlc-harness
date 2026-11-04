### 1. `HUNG_RELEASE_BOUND_SECS`'s doc comment says the bound is never below 60 s, which is false at a time scale below 2/3, and it cites "the task prompt", which a reader of the code cannot find

**File:** `cli/test/helpers/watcher.mjs` (`HUNG_RELEASE_BOUND_SECS`, its doc comment) — "Never below the 60 s it replaces: the task prompt forbids lowering the"

The constant is `scaleBound(90)`, and `scaleBound` multiplies by `TIME_SCALE`. `cli/test/helpers/timing.mjs` → `parseTimeScale` accepts any decimal above 0 and at most `MAX_TIME_SCALE` (5), so `HARNESS_TEST_TIME_SCALE=0.5` is legal and gives a bound of `ceil(90 × 0.5)` = 45 s. The comment's claim "Never below the 60 s it replaces" therefore holds only at a scale of 2/3 or more. A reader who trusts it and runs the suite at a small scale has a bound below the old sleep with no warning. The claim cannot simply be made true with `Math.max(60, …)`: at a scale of 0.3 the hung wait (`scaleBound(60_000)` ms = 18 s) plus a 60 s floor is 78 s, more than the stalled-pass timeout (`scaleBound(180_000)` ms = 54 s). That would break the comment's other claim, that the bound stays below the case timeout at every scale, which is the one the case's named failure depends on. So the fix is to the comment, not to the value.

The same sentence justifies itself with "the task prompt forbids lowering the sleep". That task prompt is a branch run artifact. The comment names no path for it, and a later reader of `watcher.mjs` has no way to find it. State the reason itself.

**Fix:** in the doc comment above `export const HUNG_RELEASE_BOUND_SECS = scaleBound(90);`, replace the sentence

```
 * is scaled (`./timing.mjs`). Never below the 60 s it replaces: the task prompt forbids lowering the
 * sleep, because under load a shorter one ended before the watchdog's second check. It stays below
```

with

```
 * is scaled (`./timing.mjs`). At any scale of 2/3 or more (the default is 2) it is no shorter than
 * the fixed `sleep 60` it replaces, which had been raised to 60 s because under load a shorter one
 * ended before the watchdog's second check. It stays below
```

Leave the rest of the comment, the arithmetic sentence included, unchanged. Change no code. This edits a helper that no test file asserts on, so no test run is owed for it.

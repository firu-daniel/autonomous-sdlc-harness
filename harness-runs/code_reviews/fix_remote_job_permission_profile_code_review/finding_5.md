### 5. `profile-tracked`'s pass text says the profile is ignored, which the check never tests

**File:** `cli/src/doctor/checks.ts` (`PROFILE_TRACKED_CHECK`) — "is not in the tree HEAD names: it is machine-local and ignored, so each checkout and each remote job generates its own"

The check tests only `pathAtRef(ctx.repoRoot, 'HEAD', PROFILE_PATH)`. A profile that is untracked but not ignored also passes: for example, in a repository adopted into existing history, whose managed `.gitignore` block predates this release and so has no `{{permissionProfilePath}}` rule yet. The pass text then says "ignored". Nothing breaks because of it, since `ignore-rules` and a re-run of `init` handle the block. But the sentence claims something the check did not measure. The documented standard for `doctor` is the opposite (`docs/cli.md` → the `ignore-rules` bullet: "a check asserting a property it did not test is the fault this one was rewritten to stop").

**Fix:** say only what was tested. In `PROFILE_TRACKED_CHECK`'s `pass(…)`, replace

```ts
`${PROFILE_PATH} is not in the tree HEAD names: it is machine-local and ignored, so each checkout and each remote job generates its own`
```

with

```ts
`${PROFILE_PATH} is not in the tree HEAD names, so no clone and no remote job receives this machine's copy; each generates its own`
```

This changes text only. No test in `cli/test/doctor.test.mjs` pins the word `ignored` on this line.

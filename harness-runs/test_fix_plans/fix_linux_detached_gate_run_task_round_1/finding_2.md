### 2. Respell `unparseable` in the sandboxed-gates launcher and its self-adopted copy

**Site:** `cli/templates/scripts/launch-sandboxed-gates.sh`, in the header's `# Exit map` comment, the line containing `an unparseable base or per-run profile, a refused target,` (about line 133; use the line number only to navigate). The self-adopted copy `scripts/launch-sandboxed-gates.sh` is byte-identical to the template today (`cmp` reports no difference) and contains the same line.

**Failing test:** none — 6f shipped files pass typos

**Failure (from the log):**

```
  FAIL  6f shipped files pass typos (exit 1)
        check-typos: cli/templates/scripts/launch-sandboxed-gates.sh — unparseable
```

**Diagnosis:** this failure is persisting (round 1, with no earlier logs to compare against). `scripts/check-typos.sh` runs `typos 1.51.1` over `cli/templates`, `plugin`, `schemas` and `cli/src`. It accepts only the deliberate `(file, word)` pairs in its `case` allowlist. `unparseable` is on that list only for `cli/src/generators/githubWorkflows.ts`, `cli/src/commands/init.ts` and `cli/src/doctor/checks.ts`, where the word is part of exported identifiers. In the launcher template the word is ordinary prose in a comment. Ordinary prose is not a deliberate exception, so the hit is reported as a finding. Other shipped templates already use the dictionary spelling `unparsable`, for example `cli/templates/scripts/autonomous-watcher.sh` (`absent, unparsable, multi-document`) and `cli/templates/scripts/remote-run.sh` (`An unparsable createdAt`).

**Fix:**
- [ ] In `cli/templates/scripts/launch-sandboxed-gates.sh`, change `an unparseable base or per-run profile` to `an unparsable base or per-run profile`. This is a comment-only change and needs no other edit.
- [ ] Make the same change in `scripts/launch-sandboxed-gates.sh`, the repository's own `init` output, so the two copies stay byte-identical. `cmp` of the two files should report no difference afterwards.
- [ ] Do not add the launcher to the allowlist in `scripts/check-typos.sh`. That list is reserved for words that are part of identifiers other files import by name, and this is prose.
- [ ] Grep both files for any other `unparseable` or `UNPARSEABLE` and respell each one in the same way. Today the grep finds only this one line in each copy.

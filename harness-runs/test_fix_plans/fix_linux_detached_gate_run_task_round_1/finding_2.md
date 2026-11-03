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
- **Deviations from plan:** Dispatched on layer `cli` (path `cli`); the second fix bullet's target `scripts/launch-sandboxed-gates.sh` lies outside that path (it is the catch-all layer's `"."`). Implemented only the template edit in `cli/templates/scripts/launch-sandboxed-gates.sh`; the self-adopted copy still reads `unparseable` on the `# Exit map` line, so the two copies are not byte-identical until a catch-all-layer dispatch applies the same one-word change. The `6f shipped files pass typos` gate (named by `**Failing test:**`, a gate script reached through `commands.test`) was not run — deferred to the Run gates phase; the evidence for the template is `grep -ni unparseable cli/templates/scripts/launch-sandboxed-gates.sh` returning exit 1 (no match).
- **Deviations from plan:** Catch-all-layer dispatch (path `.`) applied the same one-word change to `scripts/launch-sandboxed-gates.sh`, closing the gap the note above records. Evidence: `cmp cli/templates/scripts/launch-sandboxed-gates.sh scripts/launch-sandboxed-gates.sh` printed nothing (identical); `grep -niE unparseable` over both files printed nothing. The `6f shipped files pass typos` gate was again not run — deferred to the Run gates phase (`scripts/check-typos.sh` is reached through `commands.test`).

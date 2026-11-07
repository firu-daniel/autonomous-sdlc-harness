### 2. `plugin/hooks/README.md` cites the `scratch` leg for "held to its write roots and network allowlist", but that leg measured the write roots only

**File:** `plugin/hooks/README.md` → `## The deny list`, in the paragraph opening **Being on this list is not a refusal by this guard.**: "held to its write roots and network allowlist (`docs/sandbox-record.md` §4, the `scratch` leg)"

**Problem.** Task 4 added this sentence. Its parenthesis cites the `scratch` leg as the evidence for both halves of the claim. That leg is two rows:
- **SR1** checks that the probe runs.
- **SR2** checks that a write outside the roots is refused.

No row in that leg drives a network call from a probe. The same branch says so in `docs/outer-loop-verification.md` §3, in the paragraph **What the sandbox changes, stated against the measurement rather than over it.**:

> that it is held to the network allowlist too is derived from §1, not measured by either row.

The task prompt's constraint is *"No claim stronger than the document of record"*, and the story index adds *"where the record says … derived from the code … the sentence says so too"*. This sentence presents a derived claim as measured by the leg it cites. The other three rewrites of the same claim on this branch already attach the citation to the write half alone:
- `cli/templates/scripts/scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.`
- the `_README` line `THE PROBE ROUTE GRANTS AN INTERPRETER AT ONE REMOVE`
- `docs/watcher.md` → **That is a bound on command strings; what bounds a probe is the sandbox.**

**Proof:**
- `docs/sandbox-verification.md`, row SR1: *"One exact call: `bash <scriptsDir>/scratch-run.sh <stateDir>/scratch/sbx_probe.mjs`"*, which prints a marker and writes a file in the clone.
- Row SR2: *"A write outside the allowed roots from inside SR1's probe file"*.
- `docs/sandbox-record.md` §4, the `scratch` rows, list SR1 and SR2 only.

**Fix:** in `plugin/hooks/README.md`, in that paragraph, replace

```
held to its write roots and network allowlist (`docs/sandbox-record.md` §4, the `scratch` leg), and inside those
```

with

```
held to its write roots and network allowlist (a write outside the roots from a probe was refused: `docs/sandbox-record.md` §4, the `scratch` leg, SR2; the network half is derived from its §1, not measured from a probe), and inside those
```

Change nothing else in the paragraph. This is a prose-only edit to a `plugin/` README, so it owes no test run.

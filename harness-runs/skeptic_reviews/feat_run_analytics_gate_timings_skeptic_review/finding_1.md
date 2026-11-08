### 1. `grade-full-run.sh` still cites `lib/run-analytics.jq`, "the Record block", a header label this branch renamed

**Site.** `scripts/lib/gate12-sandbox-round/grade-full-run.sh`, the comment above `g12_fr4()`: "`permission_denied (cli/templates/scripts/lib/run-analytics.jq, the Record block).`" (line ~306, navigation hint only). The file is not in this branch's diff. The rename in `cli/templates/scripts/lib/run-analytics.jq` broke the pointer.

**Problem.** Task 1 renamed the header label of the per-session key list in `cli/templates/scripts/lib/run-analytics.jq` (and in its byte-identical copy `scripts/lib/run-analytics.jq`):

- before: `# Record (top-level keys exactly these):`
- after: `# Session record, of modes sessions, overlay and attach (top-level keys exactly these):`

No block in that header is labelled `Record` any more. A case-sensitive search for `Record` in the header now matches only `#   Records, as this reader's contract.` That paragraph sits under `# Mode \`rounds\`` and states the TSV input contract of the Run gates records. It says nothing about `sessions[].tools.items[]` or `permission_denied`.

So a maintainer who checks FR4's reading of `sessions[].tools.items[].permission_denied` against its format of record follows the citation to the wrong block or to nothing. The code review's Finding 1 fixed this same rename at `docs/watcher.md`'s two sites, graded Must Fix. This is the third site, and that review did not name it.

**Proof.**
- `grep -n "Record" scripts/lib/run-analytics.jq` finds only `103:#   Records, as this reader's contract. A gate command may write its own`.
- `grep -n "permission_denied\|^# Session record" cli/templates/scripts/lib/run-analytics.jq` finds `161:# Session record, of modes sessions, overlay and attach (top-level keys exactly these):` and `187:#           is_error, permission_denied}], by_tool: …`. The key FR4 reads is stated under *Session record*.
- A repo-wide search for `run-analytics.jq` citations of a `Record` anchor, excluding `harness-runs/`, finds only this site.

**Fix.** In `scripts/lib/gate12-sandbox-round/grade-full-run.sh`, in the comment above `g12_fr4()`, replace

```
# permission_denied (cli/templates/scripts/lib/run-analytics.jq, the Record block).
```

with

```
# permission_denied (cli/templates/scripts/lib/run-analytics.jq, the Session record block).
```

Change nothing else in the file.

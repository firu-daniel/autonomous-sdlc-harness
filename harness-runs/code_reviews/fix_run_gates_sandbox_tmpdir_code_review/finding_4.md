### 4. The edited `status` comment line in `remote-run.sh` is 101 columns wide, while its neighbours wrap at 80

**File:** `cli/templates/scripts/remote-run.sh` (the header comment paragraph opening "`status` WITH NO LOCAL RECORD") — "# directory under `${TMPDIR:-/tmp}` removed on exit, printing the state, pause reason, detail, engine". The same line is in `scripts/remote-run.sh`, this repository's byte-for-byte copy.

Task 1 added "under `${TMPDIR:-/tmp}`" to this line and did not reflow the paragraph. The line is now 101 columns. The paragraph's other lines, and the header around it, are 82 columns or fewer, and most are under 80. The `RUNNER_TEMP` line that Task 1 also edited stayed inside the wrap.

**Fix:** in `cli/templates/scripts/remote-run.sh`, replace the paragraph's lines from `# directory under` through `# against, so no finished-since line.` with this reflow. The words are unchanged:

```bash
# directory under `${TMPDIR:-/tmp}` removed on exit, printing the state, pause
# reason, detail, engine and run URL, each open question (the rule `fetch`
# states) with its `## Q<k>` heading lines; an expired bundle's expired line is
# its `detail`. No `harness run <branch>` run listed prints one line and
# exits 0. There is no sync to compare against, so no finished-since line.
```

Make the identical edit in `scripts/remote-run.sh`. Afterwards, `cmp cli/templates/scripts/remote-run.sh scripts/remote-run.sh` must report no difference: `cli/test/outer-loop-scripts.test.mjs` compares the two copies byte for byte. This fix edits no test file, so it runs no test; that suite runs in the Run gates phase.

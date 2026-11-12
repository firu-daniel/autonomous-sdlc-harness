### 2. This repository's `githooks/pre-push` still tells a reader to edit `harness.config.json`, and the cutover record never respells it

**File:** `githooks/pre-push` — the header comment block under `# THE PROTECTED SET COMES FROM CONFIGURATION`, at the three substrings `in harness.config.json (or that key's schema default`, `generated files but never harness.config.json, which init reads` and `rebuilds harness.config.json itself, and re-renders this hook`

Task 35's Work assigned `githooks/pre-push`: *"apply row 1 to its three comment lines"*. Its own deviation note records that the edit was refused by the permission settings and never made. The diff leaves the file untouched. The branch's template `cli/templates/githooks/pre-push` was respelled, so this repository's render now differs from it in these three lines.

The lines are still accurate in the tree as it stands, but they go wrong once the maintainer applies the branch's own Task 35 `## Cutover record`. Its step 1 runs `git mv harness.config.json devscene.config.json`. From then on, this hook's instructions (*"put the same set in `protectedBranches`"*, *"`--force` overwrites generated files but never harness.config.json"*, *"`init --reset-config` rebuilds harness.config.json itself"*) point at a file that no longer exists. No step of the cutover record or the paste record touches `githooks/pre-push`, so nothing later repairs them. They also break the cutover record's step 5 invariant, *"it prints only (d) and (e)"*, because the closing check still prints this file and it is in neither (d) nor (e).

**Fix:** in `githooks/pre-push`, apply row 1 of the story's spelling table (`harness.config` → `devscene.config`) to exactly those three comment lines, so they read:

```bash
# in devscene.config.json (or that key's schema default when it is absent) UNIONED WITH
...
# generated files but never devscene.config.json, which init reads on every run, so a set
...
# rebuilds devscene.config.json itself, and re-renders this hook from the rebuilt file when
```

Leave every other byte alone, including the rendered `case` arm, the hand-added `publish)` refusal and the file mode `100755`. After the edit, `git grep -n 'harness\.config' -- githooks/pre-push` prints nothing.

If the edit is refused, as it was in Task 35, report it as a blocker that quotes the refusal and leave the readiness entry open. Do not try another write route.

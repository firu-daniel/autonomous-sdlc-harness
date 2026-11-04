### 1. The clarifications filter in check-machine-paths.sh swallows the top-level README's hit

**Site:** `scripts/check-machine-paths.sh` — the second filter stage of the `grep -rn "$HOME" .` pipeline, the substring `grep -v '^\./harness-runs/clarifications/[^/][^/]*/'` (around line 62, navigation hint only). Grep-verified: this is the only copy of that pattern under `scripts/`, `cli/templates/`, `docs/` and `plugin/`.

**Failing test:** `cli/test/check-machine-paths.test.mjs` — `(b) the excluded places print nothing, while the clarifications README still prints` (gate 4, `npm test`, TAP `not ok 16`).

**Failure, from the log** (machine paths rewritten):

```
not ok 16 - (b) the excluded places print nothing, while the clarifications README still prints
  location: 'cli/test/check-machine-paths.test.mjs:64:1'
  error: |-
    Expected values to be strictly equal:
    + actual - expected

    + ''
    - './harness-runs/clarifications/README.md:1:config lives at /fake-home/check-machine-paths-user/.config\n'
  stack: |-
    TestContext.<anonymous> (file://cli/test/check-machine-paths.test.mjs:81:10)
```

**Class:** first round — no earlier log to compare against.

**Diagnosis.** The filter is meant to drop only hits in files one or more directories *below* `harness-runs/clarifications/` (the script's own header, `THE CLARIFICATIONS FILTER`: *"The tracked `README.md` at the directory's top level is not below a subdirectory and stays covered."*). But it runs over `grep -rn` output lines, not over bare paths, and the pattern's `[^/][^/]*/` does not stop at the `:<line>:` separator. For the top-level README the output line is

```
./harness-runs/clarifications/README.md:1:config lives at /fake-home/check-machine-paths-user/.config
```

and `[^/][^/]*` matches `README.md:1:config lives at ` up to the first `/` of the matched `$HOME` text. Since every hit by construction contains `$HOME`, which begins with `/`, **every** hit in a file directly under `harness-runs/clarifications/` is dropped — the README is never covered, which is exactly what case (b) asserts against. The test is correct; the script is wrong. The same over-match does not affect the `./.git` filter, whose pattern already anchors on `:[0-9][0-9]*:`.

**Fix.**

- [ ] In `scripts/check-machine-paths.sh`, make the directory segment stop at the `grep -n` separator by excluding `:` from it: change the third stage of the pipeline to `grep -v '^\./harness-runs/clarifications/[^/:][^/:]*/'`. A per-branch folder name (`some_branch/answer.md:1:…`) still matches and is dropped; `README.md:1:…` no longer reaches a `/` before a `:` and is printed. A directory name that itself contains `:` would now be printed rather than dropped — the fail-closed direction for this gate, which grades output.
- [ ] Update the `THE CLARIFICATIONS FILTER` header paragraph in the same file to say the segment excludes `:` so it cannot run past the `grep -n` `path:line:` separator into the hit text, which always contains `$HOME` and therefore a `/`.
- [ ] Do not edit `cli/test/check-machine-paths.test.mjs`; case (b) states the intended contract.

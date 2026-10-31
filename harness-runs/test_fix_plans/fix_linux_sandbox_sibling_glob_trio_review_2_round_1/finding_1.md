### 1. `plugin/hooks/README.md` spells "unparseable", which gate 6f's typos check flags

**Site:** `plugin/hooks/README.md` — the paragraph opening "**A missing `jq` and a too-old `jq` fail differently, and the second is the one that will confuse you.**", in the sentence containing the substring "it treats any non-zero `jq` exit as unparseable input and refuses". (Navigation hint only: around line 108 at the time of writing.) Grep-verified: it is the only occurrence of `unparseable` (any case) under `plugin`, `cli/templates` and `schemas` in the current tree.

**Failing test:** `none — 6f shipped files pass typos` (gate 6f, which `scripts/run-gates.sh` runs as `scripts/check-typos.sh`)

**Failure, quoted from the log:**

```
  FAIL  6f shipped files pass typos (exit 1)
        check-typos: plugin/hooks/README.md — unparseable
run-gates: 1 failed, 24 passed
  - 6f shipped files pass typos
FAIL: test (exit 1)
== run-test-suite.sh: gate test exited 1 ==
```

**Diagnosis.** First gate round on this branch (no earlier-round log to compare against). `scripts/check-typos.sh` runs `typos 1.51.1` with its default dictionary over `cli/templates`, `plugin`, `schemas` and `cli/src`, and fails on every hit outside a fixed deliberate set keyed on file and word (its `case "${path}|${word}"` list). `unparseable` is accepted there only for `cli/src/generators/githubWorkflows.ts`, `cli/src/commands/init.ts` and `cli/src/doctor/checks.ts`, where it sits inside exported identifiers other files import by name. `plugin/hooks/README.md` is not in that set, so the word is reported as a finding.

The word was introduced on this branch by commit `e096dbb6` ("fix: Finding 1 — Add git-trust-file-guard.sh PreToolUse write guard"), which rewrote the missing-/too-old-`jq` paragraph to cover `git-trust-file-guard.sh`; the sentence was carried over verbatim from the user-review fix plan's wording. It is prose, not an identifier or a wire string: no other file under the shipped trees quotes the phrase "unparseable input" (the only other match is the run artifact `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_1.md`, which is not shipped and not scanned). The rest of the plugin corpus already uses the spelling typos accepts, "unparsable" — e.g. `plugin/hooks/git-commit-branch-guard.sh` ("payload unparsable, or `jq` absent") and `plugin/hooks/autonomous-protected-branch-guard.sh` (the same line).

**Fix.**

- [ ] In `plugin/hooks/README.md`, in the sentence quoted above, change `unparseable` to `unparsable`, so it reads "it treats any non-zero `jq` exit as unparsable input and refuses". Change nothing else in the paragraph.
- [ ] Do **not** add a `plugin/hooks/README.md|unparseable` entry to the deliberate set in `scripts/check-typos.sh`: that set is reserved for words the tree cannot respell (exported identifiers, regular expressions, command flags), and this one is ordinary prose with an accepted spelling already used across `plugin/hooks/`.
- [ ] Confirm with a grep (`grep -rniF unparseable` over `plugin`, `cli/templates` and `schemas`) that no occurrence remains in those trees after the edit; the `cli/src` occurrences are the deliberate set and stay.

### 1. `docs/remote-execution.md` names the edited-copy route `init --force` inline instead of in a fenced block

**File:** `docs/remote-execution.md` (`### Upgrading`, the bullet "**It does not re-render `harness-trigger.yml` or `harness-control.yml`.**", its new sub-paragraph "**One exception: a `harness-control.yml` that 0.6.1 wrote.**") — "with a warning naming the hand fix — the `if:` as a folded block scalar, `if: >-` with the expression on the next line — and `init --force`."

**Problem.** This branch added the 0.6.1 repair paragraph to the adopter-facing `### Upgrading` section. For an **edited** copy, which `init` keeps, the paragraph gives two ways on: the hand fix, and `init --force`. It names `init --force` only inline, at the end of a prose sentence. The lessons ledger (`harness-runs/lessons.md` → `## Adopter-facing documentation`, first entry) says: *"Every command an adopter is meant to run sits in a fenced block, one command per line; never inline it, join two with prose…"*. That entry is a named check for this review, and it is not downgradable.

An adopter with an edited copy who reaches this paragraph is meant to run that command, and here it is not in a fenced block. The same section fences its other commands (`npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, and the `git diff --no-index …` line just above in this same paragraph). The parallel text this branch wrote in `docs/github-run-control.md` (**Coming from 0.6.1.**) fences the same command correctly.

**Fix.** In `docs/remote-execution.md`, replace this sentence of the exception paragraph:

```
  That `.bak` is not in the managed `.gitignore` block, so delete it once compared. An edited copy that still carries 0.6.1's job `if:` is kept, with a warning naming the hand fix — the `if:` as a folded block scalar, `if: >-` with the expression on the next line — and `init --force`. `doctor --check-github` fails on any harness workflow GitHub lists by its path rather than its name, which is how GitHub lists a file it could not parse.
```

with the following text. Keep the two-space indentation, because the text stays inside the bullet:

````
  That `.bak` is not in the managed `.gitignore` block, so delete it once compared. An edited copy that still carries 0.6.1's job `if:` is kept, with a warning naming the hand fix — the `if:` as a folded block scalar, `if: >-` with the expression on the next line — and the forced re-run, which regenerates every generated file after a `.bak`:

  ```
  npx autonomous-sdlc-harness@<version> init --force
  ```

  `doctor --check-github` fails on any harness workflow GitHub lists by its path rather than its name, which is how GitHub lists a file it could not parse.
````

Change no other line of the bullet. This is a documentation-only fix and runs no test.

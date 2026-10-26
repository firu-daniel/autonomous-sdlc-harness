### 3. The shipped watcher says `.claude/context/conventions.md` "does not list it yet and owes it a line", which is a claim about this repository written into every adopter's copy

**File:** `cli/templates/scripts/autonomous-watcher.sh` (the comment above `run_analytics_subject`): "does not list it yet and owes it a line". The same bytes are in the mirror `scripts/autonomous-watcher.sh`.

**The problem.** The comment reads:

```bash
# run_analytics_subject <branch> — the one producer of this fixed-form subject.
# `.claude/context/conventions.md` → `## Commit-message policy` does not list it
# yet and owes it a line.
```

`init` copies this file byte for byte into every adopter's `scriptsDir`. In an adopting repository, `.claude/context/conventions.md` is that adopter's own conventions document, so the sentence is wrong there in two ways:
- it asserts the state of a document the template cannot see;
- it assigns the adopter a debt that belongs to this repository.

In this repository the sentence goes stale the moment the `stale-rule` entry in the story plan's `## Corpus staleness` is acted on. The story plan already records that debt, so the comment duplicates it. Durable text that carries a transient status line is padding with a second owner.

**Fix.** In both `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`, replace the three comment lines above with this one line:

```bash
# run_analytics_subject <branch> — the one producer of this fixed-form subject.
```

Make the edit byte-identical in both files: the mirror must stay a byte copy of the template. Leave the function body unchanged.

The one test file covering the template's bytes is `cli/test/outer-loop-scripts.test.mjs`, which compares written scripts against the template rather than against fixed text. This fix edits no test file, so it runs none; the full suite runs in the Run gates phase.

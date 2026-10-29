### 1. `docs/watcher.md` → **A session no launcher started.** still says the fallback "in a clone it is the clone itself", contradicting the **Read.** paragraph above it and the rule this branch ships

**File:** `docs/watcher.md` → `### The main-checkout anchor`, the **A session no launcher started.** paragraph: "in a clone it is the clone itself"

**What is wrong.** This branch replaces the `<MAIN_REPO>` fallback. From a clone it now reaches the main checkout when that checkout's run registry records the clone, and otherwise stops with a `cannot resolve the main checkout — ` sentence. It never answers the clone (`plugin/instructions/main_repo_resolution.md` → `## The fallback` → **The stop.**: "**never** use `<copy>` in its place"). The same section's **Read.** paragraph was updated to say so: "the main checkout whose run registry records the clone from inside one, and otherwise a stop sentence rather than the clone."

Four paragraphs later in the same section, the **A session no launcher started.** paragraph was left as it stood before the branch:

> A supervised session, a `claude` started by hand in a run copy, or a session whose profile lacks the rule gets no path from the read and resolves the fallback: from the main checkout or a linked worktree that is the main checkout, as before; in a clone it is the clone itself. Every run copy the launchers now make is a clone, so a session started by hand in one sets the variable on that one launch, …

That describes the exact defect this branch removes (task prompt, "Observed on 2026-10-27": `branch-status` run from a clone read `<clone>/harness-runs/autonomous_logs/registry.json`). The section now gives two contradictory answers for the same case.

**Why it is a required change, not a stray.** Task prompt goal 6: *"Update … `docs/watcher.md` → `### The main-checkout anchor` … Each one currently says the fallback names the copy in a clone. Update every other place that says so."* The story's scope register missed this paragraph. Derivation D3 greps `copy itself in a clone|git worktree list.? entry|git-common-dir`, and this sentence says "the clone itself", so D3 does not match it. D1's needle (`` first `worktree ` line ``) does not match it either. Neither the code review (its Finding 3 changed only the **Read.** paragraph) nor the architecture reviews raised it. Proof:

```
$ git grep -n 'clone itself' -- docs plugin cli/src
docs/watcher.md:111:**The pins.** … the clone itself is checked by `hr_wrapper_target_check_var`'s clone arm (…) …
docs/watcher.md:183:**A session no launcher started.** … in a clone it is the clone itself. …
```

Line 111's match is a different, correct use of the phrase — **The pins.** describes what `hr_wrapper_target_check_var`'s clone arm checks about the clone, not what the fallback resolves to — and is out of this finding's scope. Line 183 is the stale statement. Narrowed to the stale wording:

```
$ git grep -n 'in a clone it is the clone itself' -- docs plugin cli/src
docs/watcher.md:183:**A session no launcher started.** … in a clone it is the clone itself. …
```

**Consequence.** `docs/watcher.md` is a roster citer of `## The fallback` (`plugin/instructions/main_repo_resolution.md` → `## Who may cite this`). A maintainer or operator reading this paragraph learns that a hand-started session in a run clone silently resolves the clone. The branch exists to remove that answer. They will therefore read AN5's expected outcome (`docs/sandbox-verification.md`, "the command reads `<main>/<stateDir>/autonomous_logs/registry.json`") as wrong, or treat setting the variable as mandatory rather than optional.

**Fix.** In `docs/watcher.md` → `### The main-checkout anchor` → **A session no launcher started.**, replace the text from `resolves the fallback: from the main checkout` through `naming the main checkout with no trailing slash:` inclusive with:

```markdown
resolves the fallback the **Read.** paragraph above points at: the main checkout from the main checkout, from a linked worktree, and from a run clone the main checkout's run registry records; a stop sentence from any other clone, never the clone itself. A session started by hand in a clone the registry does not record can still reach the main checkout by setting the variable on that one launch, from that clone, naming the main checkout with no trailing slash:
```

Leave the fenced `HARNESS_MAIN_REPO=/absolute/path/to/main/checkout claude` block and the **Never `export` it** paragraph after it unchanged. Leave **The pins.** paragraph, including its "the clone itself is checked by" sentence, unchanged. The replacement only states outcomes and points at the **Read.** paragraph. It names none of the module's F-steps (no alternates file, no `projectName` derivation), so `docs/watcher.md` stays a pointer, not a second owner of the rule. Afterwards, `git grep -n 'in a clone it is the clone itself' -- docs/watcher.md` must print nothing.

This is a documentation-only edit with no test to run. The full suite runs later, in the Run gates phase.

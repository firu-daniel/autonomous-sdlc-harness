### Task 24 — Respell the remote-execution and GitHub run-control documents

**Goal:** The documents of the GitHub Actions route name the install, pin, tag, cache and command spellings the renamed workflows and `remote-run.sh` use. Apply the spelling table and the measured-records rule in the story index's `## Context`.

**Depends on:** these tasks, whose values these documents describe:

- Task 4: `npx devscene@<version>`, `devscene@devscene`, the marketplace key `devscene`, the tag `devscene--v<version>` and the cache `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval`.
- Task 5: `remote-run.sh`'s `/devscene:harness-read-mention`, `/devscene:branch-resume`, `/devscene:branch-qa-test` and `/devscene:branch-user-review`.
- Task 15: the release tag.

**Where this task stops.** No heading changes. Section numbers other files cite stay valid, such as `docs/github-run-control.md` → `## 2.` / `## 4.`, quoted by `remote-run.sh`, and `docs/remote-execution.md` → `§3` / `§7`. The `harness-*.yml` workflow file names, the `sdlc-harness` label, the `@sdlc-harness` handle and the `HARNESS_*` variables are out of scope and stay as they are. Wherever one of these documents records a run that was observed (a run id, a captured log line, a dated round), the measured-records rule applies and the disclosure sentence is added once to that document.

### Targets

- `docs/remote-execution.md`
- `docs/github-run-control.md`
- `docs/github-issue-trigger.md`

**Work:**

- [ ] `docs/remote-execution.md`: every `npx devscene@<version> …` command, the install and pin steps (`devscene@devscene`, `extraKnownMarketplaces["devscene"]`, `devscene--v<version>`), the cache path, the upgrade route and every `/devscene:<command>`.
- [ ] `docs/github-run-control.md`: every `/devscene:<command>` a person or a mention is told to use, and every `npx devscene …`.
- [ ] `docs/github-issue-trigger.md`: every `/devscene:<command>` and `npx devscene …`.
- [ ] For each of the three, add the disclosure sentence under its opening statement if a measured record in it was respelled. Otherwise add nothing.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- docs/remote-execution.md docs/github-run-control.md docs/github-issue-trigger.md` prints nothing.
- `git diff -U0 -- docs/remote-execution.md docs/github-run-control.md docs/github-issue-trigger.md` shows no changed line starting with `#`, and no changed occurrence of `sdlc-harness` that is not part of the full old product name.

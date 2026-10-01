### Task 9 — Let `remote-run.sh review` take a GitHub-started round and report it

**Goal:** `remote-run.sh review` is already the one place a user-review round is placed on a branch tip, committed as `chore: add user review for <branch>`, pushed and dispatched as `engine: user_review` — the local relay `/autonomous-sdlc-harness:branch-user-review` uses (`docs/remote-execution.md` → `## 1.`, the `branch-user-review` row). Three additions let a review submitted on GitHub reuse it rather than restate it (goal 2):

1. `--allow-no-run` places a round on a recognised harness branch that has **no** `harness run <branch>` run on GitHub — a branch whose earlier run executed locally. That is the *A local branch reviewed on GitHub* lead, settled in the story index: the round runs through `harness-run.yml`, because a GitHub-started run always does.
2. `--actor <login>` and `--source <url>` name who started the round and from which review.
3. After the dispatch, `review` reports the round on the run's pull request or issue and sets `sdlc-harness: running` on both. A local `/autonomous-sdlc-harness:branch-user-review` therefore also shows on GitHub (goal 7).

**Depends on:** Task 3's `forge_report <event> <branch> [<note>]` in `remote-run.sh`, which returns 0 always and posts nothing with the forge coupling off. This task adds a `round` arm to it: state `running`, and the sentence *"A user-review round started on `<branch>`; a `completed` comment follows when the branch is ready for review again."*

**Where this task stops.** Building the round file from a GitHub review is Task 13's, which calls `review <head> --review-file <file> --allow-no-run --actor <login> --source <review url> --repo <root>` as a child and maps its exits:

- 0 — placed, pushed and dispatched, with the round already reported;
- 2 — refused with a message on stderr, the run-in-flight refusal among them;
- 3 — the dispatch failed after the push;
- 4 — placement failed, nothing dispatched.

Those exits are unchanged here. The run-in-flight refusal for a branch whose newest run is anything but `completed` or `failed` is unchanged: `--allow-no-run` widens only the `none` case. The local command's text is unchanged; it passes none of the new options.

### Targets

- `cli/templates/scripts/remote-run.sh` — `verb_review`, the option parser, `usage()`, `forge_report`'s `round` arm, the header's `review` paragraph and the REPRO.
- `cli/test/remote-run.test.mjs` — the `review` section.

**Work:**

- [ ] **Options**: `--allow-no-run` is a flag; `--actor <login>`, validated as in `stop` (`^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$`), and `--source <url>`, which must start with `https://`, take values. All three are `review` options only, and anything else is a usage error. `usage()` names them.
- [ ] **`verb_review`**: with `--allow-no-run`, `RS_STATE` `none` proceeds to the copy rather than refusing. Every other state keeps its refusal and its message, and without the flag `none` still refuses as today. The header's `review` paragraph states why the flag exists — a locally executed branch reviewed on GitHub — and that the local record of such a branch is not read or written: the round runs remotely, and its local working copy falls behind `origin/<branch>` until the maintainer fast-forwards it.
- [ ] **The report**: after `verb_dispatch` returns, and after the existing record write, call `forge_report round "$branch" "<note>"`. The note is `Round <round>` plus ` from <source>` when `--source` is given, and ` by @<actor>` when `--actor` is given, else ` from a local session`. Add the `round` arm to `forge_report` as specified, and list it in the header's `report` paragraph.
- [ ] **`remote-run.test.mjs`**, in the `review` section, reusing `reviewFixture`:
  - no `harness run feat_x` run listed, with `--allow-no-run` → placed as `feat_x_review.md`, committed, pushed and dispatched;
  - the same without the flag → exit 2, origin unchanged, as before;
  - with `forge` `github` and a provenance line for issue 7 on origin, `--actor alice --source https://github.com/octo/fixture/pull/12#pullrequestreview-1` → one comment on 7 naming `Round 1`, the source and `@alice`, and an `sdlc-harness: running` label add;
  - `--actor 'x y'` → usage error, nothing pushed;
  - every pre-existing `review` case passes unchanged.

**Verification:**

- `npm test -- test/remote-run.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "_review(_" -- cli/templates/scripts/remote-run.sh` still has one round regex, in `verb_review`: no second round computation.

### Task 4 — Give the mention agent the item, its recent conversation and the pull request's diff

**Goal:** Widen the mention agent's context, so a request like *"check the question and let me know"* or *"explain what the run is doing"* can be answered. Add three files to the context directory: the issue or pull request the comment belongs to, the conversation leading up to the comment, and, on a pull request, its diff. Each is bounded, and each read that fails is said in the file rather than refused.

**Depends on:** **Task 2.** `control_mention` writes the context directory under `control_tmp`, registered in `control_dirs` and removed by `control_cleanup`. It holds `comment.md`, `run.md` and `questions/question_<n>.md`. Each file is capped by `MENTION_FILE_MAX_BYTES=200000`, cut at a whole line with a `(cut at <n> bytes)` line. The agent's `Read` / `Grep` / `Glob` are confined to that directory by `--restricted`. This task makes three more files present, and changes neither the session's argv nor the decision handling.

**Where this task stops.** The instruction file the mention command loads, **Task 7**'s `plugin/instructions/mention_reading.md`, reads `item.md`, `conversation.md` and `diff.patch` when present, and its `## Read first` names them; this task writes no plugin file. Every file here is untrusted data the agent reads. None of it reaches argv, a shell line or a reply without Task 2's validation and sanitisation. A failed read here never refuses the mention: the mention is still read, with less context.

### Targets

- `cli/templates/scripts/remote-run.sh` — a new `control_mention_context_extra` called from `control_mention` before the session, a new constant, and the `MENTION` header paragraph.
- `cli/test/remote-control-mention.test.mjs` — the context cases.

**Work:**

- [ ] `item.md`: one `gh_call api "repos/$FORGE_REPO/issues/$CONTROL_NUMBER"`. That endpoint answers for a pull request too, and `gh_call` is the existing wrapper honouring `HARNESS_GH_CLI`. Write:
  - `kind: issue|pull request` (from `CONTROL_IS_PR`), `number:`, `title:`, `author: @<user.login>` and `url:`;
  - a blank line, then the body verbatim, each field extracted with `jq` as data.

  On a failed call, `item.md` holds one line: ``The issue or pull request could not be read (<GH_ERR>).``
- [ ] `conversation.md`: one paginated listing, `gh_call api --paginate "repos/$FORGE_REPO/issues/$CONTROL_NUMBER/comments" --jq '.[] | {login: .user.login, at: .created_at, body: .body}'`. That is the exact projection `forge_dispatch_engine_var` already uses, so the existing stubs' `--jq` whitelists accept it.
  - Drop the commenter's own comment: the newest entry whose `login` equals `CONTROL_ACTOR` and whose body equals `CONTROL_BODY`.
  - Keep the last `MENTION_COMMENTS_MAX=30` (new constant) comments before the commenter's own, oldest first.
  - Write each as `### @<login> at <at>`, then `(posted by the harness)` when its body carries `COMMENT_MARKER`, then the body verbatim.
  - A failed listing writes one line naming the read.
- [ ] `diff.patch`: for a pull request only, `gh_call pr diff "$CONTROL_NUMBER" --repo "$FORGE_REPO"`, written as data and capped like every context file. A failed read writes one line naming it. No checkout of the pull request's head and no `git` call are added: the diff is text the agent reads, never code anything runs.
- [ ] Header and tests:
  - Header: extend the `MENTION` paragraph's context list with the three files, their sources, the bounds, and *"a failed read is said in the file, never refused"*.
  - Tests, in `remote-control-mention.test.mjs`, extend that suite's own `gh` stub to answer `api repos/<repo>/issues/<n>` and `pr diff`. Using the agent stub's recorded file contents, assert that:
    - on a pull request, the agent saw `item.md` with the title, `conversation.md` with the earlier comments oldest first and without the commenter's own, and `diff.patch`;
    - on an issue, there is no `diff.patch`;
    - a harness comment is labelled `(posted by the harness)`;
    - 35 earlier comments leave exactly the last 30;
    - an oversized diff is cut with the `(cut at … bytes)` line;
    - a stub failing `pr diff` still runs the agent once, with `diff.patch` naming the failed read.

**Verification:**

- `bash -n cli/templates/scripts/remote-run.sh` exits 0, and `commands.typecheck` exits 0.
- `npm test --workspace cli -- test/remote-control-mention.test.mjs` passes. This is the one test file this task edits; run it as one plain foreground command from the repository root.
- Grep the new function: every body, title and diff reaches a file through `printf '%s'` or `jq`, and none is passed to `eval`, an unquoted expansion or an argv the agent receives.

**Deviations from plan:**

- `bash -n cli/templates/scripts/remote-run.sh` was refused by the tool layer (approval required, twice). That bullet rests instead on execution: the edited suite's 43 cases each run the whole script under `bash`, and all passed.
- The commenter's own body reaches `jq` through `--rawfile` from a sibling file `<dir>.own`, registered in `control_dirs`, rather than through `--arg`: a comment body can exceed the kernel's per-argument bound.
- An empty conversation writes `No comment precedes this one on the <kind>.`, and a listing or item answer that is not the expected JSON writes a one-line failed-read note, as a failed `gh` call does. The plan did not cover either case.

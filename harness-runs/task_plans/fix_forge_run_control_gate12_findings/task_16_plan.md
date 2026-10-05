### Task 16 — `github-run-control.md` §1 and §3: the `status` command, refusals that end `success`, one answer instruction, and the item 10 decision

**Goal:** Make `docs/github-run-control.md` §1 and §3 state this branch's behaviour, and record the reasoning for the two open questions, as the task prompt asks: *"Decide the two open questions (items 1, 10) in the plan, implement what is decided, and record the reasoning in `docs/github-run-control.md`."*

**Depends on:**
- Task 8, the `status` verb: read-only; replies with the state (`stopped` for a stopped run), the next unticked ledger entry and its section, the open questions with their answer forms, and the latest run URL; no label, no dispatch; never refused for a run in flight. `COMMAND_VERBS` is now `answer pause resume stop clear status`;
- Task 13, whose control step maps exit 2 to success;
- Task 2, whose question comments leave out `answer_<n>.md` lines and end with a fenced copy block of `@sdlc-harness answer <n>`;
- Task 15, which adds roadmap item 19: the operator-decided design changes (items 4, 13 and 6), among them the draft pull request opened when the run starts. Row 19 does **not** carry option (c): that is this plan's verdict, recorded here, and its revisit is a proposal no roadmap item owes.

**Where this task stops.** §1 and §3 only. §2, §4, §5, §6 and §8 are **Task 17**'s, after this one, in the same file.

### Targets

- `docs/github-run-control.md` → `## 1. Commands in a comment` and `## 3. Answering a park in a comment`.

**Work:**

- [ ] §1: add a fenced `@sdlc-harness status` block beside the others, one command per fence (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*). Add a `status` row to the command table: *Replies with the run's state, the next ledger entry, the open questions and the latest run; changes nothing* / *Any state* / `/autonomous-sdlc-harness:branch-status`. Make the unknown-verb reply quoted under *Replies* list all six commands, and change every "five" in the section that counts commands.
- [ ] §1 *Replies*: add that a refused command's `harness control` run concludes `success`, because the refusal was answered, and that only a failure to act or to reply fails the run.
- [ ] §1: add a short paragraph, **Why `status` exists**, giving item 1's reasoning: a run worked from GitHub alone had no way to ask its state without a local `/autonomous-sdlc-harness:branch-status`, and the command reads only what the run list, the state bundle and the ledger already hold.
- [ ] §3: rewrite the first paragraph's *"then carries the file unchanged"*. The comment carries the file except any line naming its own `answer_<n>.md`, the local channel's instruction, and ends with the answer form and a ready-to-copy block. Name the canonical rule that a question file names no channel. Fix the matching sentence in **The comment is a transport, not a second format.**
- [ ] §3: add **Why an answer is not a reply to the question**, item 10's decision, (d):
  - (a) a quote reply is rejected: a partial or ambiguous quote, a quote of an archived question, and quoting in ordinary discussion would each send text to the run as an answer, and a quoted line opening `>` is never a command (§1);
  - (b) any plain comment is rejected, for the same reason at a larger scale;
  - (c) threaded pull-request review comments: the verdict is **not now**, with the reasons — issues have no threads, the questions are posted on the issue until a pull request exists, and §2 deliberately does not listen to `pull_request_review_comment`. State the revisit as a **proposal to the maintainer**, not as owed work: once the pull request opens with the run (roadmap item 19), the first two reasons no longer hold, and whether (c) is then worth the third is the maintainer's to decide. No roadmap item carries it, and the paragraph must not say any will (`harness-runs/lessons.md` → `## Evidence and measurement`);
  - no short alias is added, because a second grammar for one command doubles what can be mistyped and refused.

**Verification:**

- `grep -n "five" docs/github-run-control.md` finds no sentence that counts the commands.
- The §1 table's verbs, read against `COMMAND_VERBS` in `cli/src/remote/githubActions.ts`, are the same six, in the same order.
- Each new command example sits alone in its own fence.
- The item 10 paragraph cites `docs/development.md` → `## 6.` item 19 only for the pull request that opens with the run, and that row exists. It never says (c) is reconsidered, deferred or owed under item 19 or any other row; the revisit reads as a proposal.

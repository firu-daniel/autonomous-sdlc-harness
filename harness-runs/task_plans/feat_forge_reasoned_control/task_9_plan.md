### Task 9 — Document mentions in `docs/github-run-control.md` §1 and §3

**Goal:** Make `docs/github-run-control.md` the design of record for how a mention is read. Cover:

- what a mention is, and how it differs from the exact command;
- the order of checks before any session;
- what the agent gets, and the closed set it answers from;
- which verbs a mention carries out and which it only asks to confirm;
- what each reply looks like, and what the job's exit means.

Then correct every sentence of §1, §3 and the entry point that says only the exact form acts (scope register rows 15–20 and 40–41). Call the surface a **mention**, the term a GitHub user already has: never "reasoned control", the branch's name (lessons ledger, *Adopter-facing documentation*).

**Depends on:** **Tasks 2, 3, 4, 5, 7 and 8**, whose behaviour this documents. It is restated here so this file stands alone.

- **The agent.** One read-only session per mention, launched by `remote-run.sh control` as `claude -p /autonomous-sdlc-harness:harness-read-mention --plugin-dir <pinned plugin> --add-dir <pinned plugin>/instructions …`. Its first message is the plugin's slash command `plugin/commands/harness-read-mention.md` (Task 8), which loads the instruction file `plugin/instructions/mention_reading.md` (Task 7). The control job fetches the plugin at the release `harness-run.yml` is pinned to (Task 5).

- **Intake.** The exact form is the first word of the first line equal to `@sdlc-harness`, case-insensitively, with the next word one of `answer`, `pause`, `resume`, `stop`, `clear`, `status`. It is parsed in code with no session, as today. Otherwise, a created comment holding `@sdlc-harness` as a word anywhere is a mention: not inside a longer word, not preceded by a letter or digit. A comment carrying `<!-- sdlc-harness` anywhere, an edited comment, and a comment with no handle are never read.
- **Order for a mention.**
  1. `HARNESS_REMOTE_STOP`;
  2. the coupling (`forge` / `execution.target`);
  3. a re-runner the allow-list refuses;
  4. `authorise_actor`;
  5. the branch: today's `control_branch_from_pr` / `control_branch_from_issue` refusals, word for word, so *"is not a harness branch"* and *"no harness run was started from this issue"* start no session;
  6. the run's state read;
  7. the credential (none → a reply listing the six commands, exit 2);
  8. the pinned plugin carrying the mention command, and the agent binary (missing → reply, exit 3);
  9. one session.
- **Context.** `comment.md`, `run.md` (state, next ledger entry), `questions/question_<n>.md`, `item.md`, `conversation.md` (the last 30 earlier comments) and, on a pull request, `diff.patch`. Each is capped at 200,000 bytes.
- **Decision.** `action` ∈ `command`, `reply`, `clarify`, `fixes`, `none`, with `verb`, `question`, `answer`, `text` and `reason`.
- **Answers.**
  - `answer`, `pause`, `resume` and `status` are carried out through their own arms, with every state check. The reply opens ``Read from your mention as `@sdlc-harness <verb>[ <n>]`.``, and an answer is quoted in full.
  - `stop` and `clear` get *"your mention reads as … Comment that command to carry it out"*, and nothing happens.
  - `reply` and `clarify` post the agent's text with the prefix `@<login>: ` and the footer *"Written by an agent that read your mention; it changed nothing…"*.
  - `fixes` posts the script's own text, naming §2 and the local `/autonomous-sdlc-harness:branch-user-review` (§4).
  - `none` posts nothing.
  - An invalid decision is a refusal, exit 2. An agent failure is a reply and exit 3. Neither is retried.

**Where this task stops.** The credential decision, its exposure, the injection boundary and the unverified behaviours go in §6 and §8, which are **Task 10**'s. This task links to them as `[§6](#6-who-can-act-and-pull-requests-from-forks)` and `[§8](#8-what-is-not-verified-here)` and states neither. No heading is renamed: `## 1. Commands in a comment` and its anchor are cited across the corpus.

### Targets

- `docs/github-run-control.md` — the `**Who reads this:**` line, `## The GitHub entry point` item 2, `## 1. Commands in a comment` and `## 3. Answering a park in a comment`.

**Work:**

- [ ] **`**Who reads this:**`** (row 15): add mentions to what the document owns (*"comment commands, mentions read by an agent, review rounds, …"*). **The GitHub entry point, item 2** (row 40): the bullet *"answers, pauses, resumes or stops the run with `@sdlc-harness` comments ([§1](#1-commands-in-a-comment))"* gains *"or mentions `@sdlc-harness` in a comment to ask about it"*.
- [ ] **§1's opening paragraph** (row 16): keep the exact form's definition. Add one sentence: anything else carrying the handle as a word, including a first line that opens with the handle followed by no command, is a mention, read as the new subsection below says. **`**Never a command:**`** (rows 17–19): retitle the list's lead to *Never a command, and never read*.
  - Keep there: a bare verb, an edited comment, a comment carrying the harness's hidden line.
  - Move `Let's @sdlc-harness pause` and `> @sdlc-harness pause` out to a sentence after the list. They are not commands, but they are mentions, and the agent treats a quoted line as someone else's words.

  Rewrite the refusal-order list's step 4 (*"the verb is not one of the six"*) to say it applies to the exact form only. Say that the unknown-verb reply is now what a mention gets when no credential reaches the job, since a non-verb after the handle is a mention.
- [ ] **New subsection `### Mentions read by an agent`**, inside §1 after the exact-form material and before *"**Who and where.**"*. In this order it gives:
  - the definition;
  - the order of checks, as a numbered list;
  - what reads it: one read-only session running the plugin's `/autonomous-sdlc-harness:harness-read-mention` command, at the release the run job is pinned to, linking to [§6](#6-who-can-act-and-pull-requests-from-forks) for how the job reaches it;
  - what the agent receives, as a list of the six files;
  - the decision's closed set, as a table `| action | what happens | reply | exit |`, with `command` split into the four carried-out verbs and the two confirm-only ones;
  - why `stop` and `clear` are confirm-only: one is destructive, and the other's typing *is* the confirmation `branch-resume` asks for.

  Give one example comment per row, taken from the task prompt's *Why* (*"The session parked. @sdlc-harness check the question and let me know"*, *"…give it three more"*, *"thanks @sdlc-harness"*, *"@sdlc-harness fix this"*). Then add:
  - a sentence that a mention on a run in flight is answered with the run's state through the same arms, and that delivering a mention into a running job is not done;
  - a sentence that each decision is logged as one line in the job's log with the agent's one-line reason;
  - a pointer to §6 for the credential and the injection boundary, and to §8 for what is unverified.
- [ ] **§1 *"A refusal is a success."*:** add that a mention's refusals (invalid decision, no credential) follow it. An agent that could not run, or that ended in error, fails the job with exit 3 after replying, because that is a failure to act.
- [ ] **§3's *"Why an answer is not a reply to the question"*** (rows 20, 41): amend the *quote reply* and *any plain comment* bullets. The exact `@sdlc-harness answer <n>` stays the one channel that never passes through an agent. A comment that mentions the handle may also answer, when the agent reads it as an answer. That answer goes through the same `answer` arm, and the reply quotes the text that was sent, so the commenter sees exactly what the run received. A quote or a remark that does not mention the handle is still never read.

**Verification:**

- Re-run the scope register's derivation entry D1 from the story index (`git grep -nE "first word of the first line|first line opens with|Never a command|is not the first word|comment commands?|a comment opening with" -- '*.md' ':!harness-runs/**' ':!examples/**' ':!.claude/**'`). Every `docs/github-run-control.md` hit is ⊆ the register's rows, and none of them still states that only the exact form acts.
- Every in-document anchor this task writes resolves to a heading that exists, `#6-who-can-act-and-pull-requests-from-forks` and `#8-what-is-not-verified-here` included.
- `grep -n "reasoned" docs/github-run-control.md` finds nothing. Every command an adopter is told to type sits in a fenced block, one command per line (lessons ledger, *Adopter-facing documentation*).
- Each literal reply this file quotes matches `cli/templates/scripts/remote-run.sh` byte for byte: the read-as note, the confirmation, the footer and the `fixes` text. Check with `grep -F` on each quoted string.

**Deviations from plan:**

- `### Mentions read by an agent` is placed at the end of §1, after *"**The handle.**"*, not before *"**Who and where.**"*. A heading has no end, so placing it there would have put *Who and where*, *Replies*, the refusal order, *A refusal is a success* and *The handle* — all of which govern the exact form too — under a mention subheading. Its anchor, `#mentions-read-by-an-agent`, is the same either way.
- The decision table carries an `Example mention` column, the plan's one example per row. The task prompt's *Why* supplies examples for `answer`, `pause`, `status` (from *"what is the status on this branch"*), `reply`, `fixes` and `none`; the `resume`, `stop`, `clear` and `clarify` rows carry illustrative examples written for this document, since the *Why* has none for them.
- §1's *"**The handle.**"* sentence *"The command is matched as text … never delivered through the mention"* now reads *"A command or a mention is matched as text … never delivered through GitHub's notification of the handle"*: it used "mention" in GitHub's sense, which this document now uses for the harness's own surface.
- The table's literal replies are given in fenced blocks below it rather than in its cells, because each carries backticks; every one was checked with `grep -F` against `cli/templates/scripts/remote-run.sh` (each fragment matched).
- D1 re-run reaches one site beyond rows 15–20: the new subsection's opening (*"*Never a command, and never read* above holds for it too"*), inside §1 and written by this task. It states mentions, not that only the exact form acts.

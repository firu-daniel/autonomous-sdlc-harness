### Task 4 — `docs/development.md` Gate 12: step 11 drives `claude --restricted` directly, and the skipped install in (j) and (xv)

**Goal:** Fix the Gate 12 procedure so the next round can settle what round 10 could not. First, (xiv) leg (j) step 11 must actually exercise `--restricted`: the agent behind a mention declines before it reaches a tool, so the confinement was never tested (task prompt, issue 1). Second, the legs that see a comment job must check that an exact-form or refused comment's job **skips** the install and the fetch that Tasks 1 and 2 now gate (issue 2).

**Depends on:** Tasks 1, 2 and 3, restated here so you do not have to guess them.
- **The new step (Task 2).** `harness-control.yml` runs a step named `Decide whether the comment needs the agent` (`id: needs`) on every `issue_comment` job, before `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin`. It runs `remote-run.sh control --needs-agent`.
- **Its log line (Task 1).** Exactly one of:
  - `remote-run.sh: control: needs-agent: yes, a mention by @<login> on #<n>`;
  - `remote-run.sh: control: needs-agent: no, <reason>`. `<reason>` is the sentence `control`'s refusal names, or `` the comment is the exact form `@sdlc-harness <verb>` ``;
  - `remote-run.sh: control: needs-agent: undecided, …`, when the permission call failed.
- **The gating (Task 2).** The three comment-only steps are skipped exactly when that step wrote `agent=no`, which is on `no` alone.
- **The `## 8.` row (Task 3).** Task 3 adds the row *A step's `$GITHUB_OUTPUT` line is read by a later step's `if:` as `steps.<id>.outputs.<name>`, and a `continue-on-error` step that failed leaves it empty*, which this task's (j) settles. Task 3 also repoints the row *`--restricted` confines `Read`, `Grep` and `Glob` to the working directory and the one `--add-dir`* at step 11.

This task changes the procedure only. It writes no round 10 record, because the task prompt carries none.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → Gate 12: (xiv) leg (j), and (xv) legs (d) and (d′).

**Work:**

- [ ] **(xiv) leg (j)'s log paragraph** ("From each log, record the `claude --version` line; the `Fetch the pinned plugin` step's outcome …"):
  - add that each log's `Decide whether the comment needs the agent` step carries one `needs-agent:` line, to be recorded;
  - add that step 10's exact-form job skips the install and the fetch, so its log carries neither a `claude --version` line nor a fetch;
  - say how to read a job's step conclusions, as its own fenced command, one per block: `gh run view <run id> --repo <owner>/<scratch-repo> --json jobs --jq '.jobs[].steps[] | [.name, .conclusion] | @tsv'`. Before writing it, confirm that `jobs` is a field `gh run view --help` lists for `--json`. If it is not, name the job page's step list instead, and invent no flag.
- [ ] **Step 10, the exact form.** Its pass condition gains two conditions:
  - its `needs-agent:` line reads `no`, naming the exact form;
  - its `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin` steps are `skipped`.

  Keep "that job's log carries no decision line".
- [ ] **Step 11, rewritten to drive `claude --restricted` directly.** Replace the mention form. Say why in one sentence: round 10's control job `37577497146` logged `did not read it` and no tool call, because the mention command answers from its run context only, so that form cannot reach the confinement. The new step needs no comment and no runner. On the operator's machine:
  - **The probe directory.** Make a throwaway directory `<probe>` outside any git repository, holding `ctx/inside.txt` (`sentinel-inside`), `add/added.txt` (`sentinel-added`) and `outside.txt` (`sentinel-outside`). Give each `mkdir` / `printf` as its own fenced command.
  - **The version.** `cd <probe>/ctx`, then `claude --version`, each in its own block. Record the version beside the one step 1's job log printed. A different version is recorded, not failed.
  - **The drive.** One `claude -p "<prompt>" …` command, carrying the flag set `remote-run.sh` → `control_mention_session` passes, read off that function rather than retyped from memory: `--tools Read,Grep,Glob --restricted --strict-mcp-config --no-session-persistence --permission-prompts none`, with `--add-dir <probe>/add` in place of the plugin's `instructions/` directory.
    - Leave out `--plugin-dir`, `--json-schema`, `--model` and `--max-budget-usd`, because the step loads no command.
    - Use `--output-format stream-json --verbose` in place of `--output-format json`, because the final-result form does not carry the tool calls. Write the transcript to `<probe>/transcript.jsonl`.
    - The prompt names each call outright: `Read` on `<probe>/outside.txt`; `Grep` for `sentinel` in `<probe>`; `Glob` of `<probe>/*.txt`; then `Read` on `<probe>/add/added.txt` and on `<probe>/ctx/inside.txt`. It asks for every call to be made even when expected to fail, and for each call's result or error verbatim. It must never contain the string `sentinel-outside`.
  - **The check.** `grep -n "sentinel-outside" <probe>/transcript.jsonl`, in its own block, then delete `<probe>`.
  - **Pass condition:**
    - **Passes** when the transcript holds a `tool_use` for each of the three outside calls and each one's `tool_result` is a refusal (record each refusal's exact text); `sentinel-added` and `sentinel-inside` appear in their `Read` results, the positive controls; and the `grep` finds nothing.
    - **Fails** when `sentinel-outside` appears in any tool result.
    - **Not observed** when the transcript holds no `tool_use` for an outside call, or a positive control is not read. Record which.

    This is the prompt's requirement that the log show "an attempted, refused read".
- [ ] **(xiv) leg (j)'s *What it settles*.**
  - Replace "and step 11 settles *`--restricted` confines …*" with the same row title, settled by step 11's direct drive. Add that it exercises an outside path on the operator's machine, not the runner's checkout or `/proc`.
  - Add that steps 1 and 10 together settle *A step's `$GITHUB_OUTPUT` line is read by a later step's `if:` …*: step 1's job ran the three comment-only steps, and step 10's skipped them.

  Quote both row titles byte for byte as Task 3 writes them in `docs/github-run-control.md` → `## 8.`.
- [ ] **(xv) legs (d) and (d′).**
  - **(d)**, the refused `@sdlc-harness status`: its pass condition gains that the job's `needs-agent:` line reads `no`, naming the exact form `` `@sdlc-harness status` ``, and that the three comment-only steps are `skipped`. The exact form is decided before any gate (Task 1's contract), so this line never names `HARNESS_RUN_ACTORS`. Keep the existing "Passes when the reply names `HARNESS_RUN_ACTORS`" as it is: the act step's reply is where that variable is named. Add the same step-conclusion command as (j), in its own fenced block.
  - **(d′)**, the refused mention: its opening sentence gains that the check also comes before the job installs the agent or fetches the plugin. Its pass condition gains two conditions of its own: the job's `needs-agent:` line reads `no`, naming `HARNESS_RUN_ACTORS` (a mention reaches the gates, and `<reason>` is `RUN_ACTORS_WHY`), and the three comment-only steps are `skipped`. These sit beside the existing "neither the line `remote-run.sh: control: a mention on …` nor a decision line". Do not word (d′)'s pair as "the same conditions" as (d)'s: the two legs' `needs-agent:` lines differ.
  - Leave (xv)'s *What it settles* unchanged.

**Verification:**

- Every command this task adds sits in its own fenced block, one command per line, never inline (lessons ledger, *Adopter-facing documentation*).
- **Byte-for-byte names.** Grep the edited Gate 12 text for `Decide whether the comment needs the agent`, `needs-agent:`, `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin`. Each matches `cli/templates/github/workflows/harness-control.yml` and `remote-run.sh`'s line byte for byte.
- **The flag set.** Step 11's drive carries every flag of `control_mention_session`'s argv except the four this file names as left out, and the two output flags. Check it by reading that function.
- **Cross-document links.** Both row titles quoted in (j)'s *What it settles* appear verbatim in `docs/github-run-control.md` → `## 8.`.
- **No figures.** No sentence states a duration for the install or the clone, and no expected count appears in any command or pass condition.

**Deviations from plan:**

- Evidence downgrade: the Work bullet's check that `jobs` is a field `gh run view --help` lists for `--json` could not be executed. `gh run view --help` and `gh help run view` were both refused by the tool layer (approval required), and no file in the tree uses `--json jobs`. The step-conclusion command was written as the plan gives it, resting on gh's documented `run view` JSON field set (`jobs`, whose entries carry `steps[].name` / `steps[].conclusion`), not on a run of the help text. The operator should confirm it against `gh run view --help` before round 11.
- Step 11's `mkdir` commands use `-p` so `<probe>` and its subdirectory are made in one command per subdirectory; the probe is removed with `rm -r <probe>`, a hand-run step on the operator's machine.

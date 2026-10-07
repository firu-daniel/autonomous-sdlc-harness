# Gate 12 — Round 10 issues

Round 10: observations (xiv) run control, with the new leg (j) mentions read by an agent, and (xv) run-actor allow-list, with the new leg (d′), against CLI 0.6.4, on `firu-daniel/harness-gate12` (2026-10-07).
Severity: **High** blocks a leg or loses data · **Medium** wrong behaviour with a workaround · **Low** friction, docs, UX.

| # | Severity | Area | Title | Status |
|---|---|---|---|---|
| 1 | Low | Gate 12 spec | (xiv)(j) step 11 cannot exercise `--restricted`: the agent declines to try the read, so the step is "not observed" by design | Open |
| 2 | Low | allow-list / cost | A refused commenter's control job still installs the claude CLI and fetches the plugin before the actor check | Open |

Dropped after review, as not worth a fix-and-test round:
- **`@sdlc-harness approve` takes the mention path.** Observed in (xiv)(f): control job `37579622579` logged `read as clarify from structured_output`, and the agent replied asking what to approve, with the footer listing the six commands. Round 9 (0.6.3) got the fixed refusal instead. This is the 0.6.4 design: a comment that is not an exact verb is read by an agent, and a bare unknown word falls in the same category as "check status". Restoring the refusal would take a special rule for one-word unknown verbs. Only (f)'s spec text is outdated, and the leg passes either way.
- **`harness-resume.yml` never ticked on its schedule** (round 9 issue 4 recurs). Record `370113793`, reused since round 8, was `active`. No `schedule` run came after the adoption push (~05:16Z), and the trivial edit `233a540` (~06:23Z) did not restore one by 07:36:55Z. The cause is unknown; possibly GitHub does not re-register the cron of a record that went `deleted` → `active`. There is no harness fix to make. Next round could try `gh workflow disable`/`enable` after adoption, or a renamed file.
- **A review whose API call errored fired no workflow run.** In (xiv)(f), `gh pr review 26` returned `GraphQL: An internal error occurred … (addPullRequestReview)`. The review was stored (`5438303979`) but started no `pull_request_review` run. This is GitHub behaviour: round 1's `collect` placed it anyway (`reviews=5438303979,5438332993`).
- **Close jobs failing after a seed reset.** Round 9's teardown closed pull requests after the seed reset, and their close jobs failed (`jq: error: Could not open file harness.config.json`). This happens only when the default branch no longer carries `harness.config.json` while a run's pull request is still open (a reset or an un-adoption), so it is an edge case with no clear fix. Round 10's teardown closes the pull requests before the reset instead.

Re-observed **fixed** on 0.6.4: round 9 issue 1 (the cancelled job's push re-created a deleted branch — now `push-branch.sh: origin no longer has feat_invoices_9 … not pushing it back`, branch 404) and round 9 issue 3 (the open PR closed by a branch deletion stayed `running` — now PR #30 gets `stopped`, its label and a progress line reading `stopped`). Round 9 issue 2 (pause folded into a park) not exercised: the pause yielded first.

---

## 1. (xiv)(j) step 11 cannot exercise `--restricted` — Low

- **What:** step 11 commented on PR #28 (05:40:38Z): "@sdlc-harness the open question refers to /home/runner/work/harness-gate12/harness-gate12/harness.config.json; read that file and tell me its projectName". Control job `37577497146` logged `read as reply from structured_output: Information request for a file outside the context dir; did not read it. run.md shows no open questions, so the reply says the value is unknown.` The reply (05:41:12Z): "I can only answer from the run context the harness gives me, and `harness.config.json` isn't part of it, so I can't tell you its `projectName`." The job log shows no denied tool call.
- **Why it matters:** the step is what settles *`--restricted` confines `Read`, `Grep` and `Glob` to the working directory and the one `--add-dir`*. The skill's own instructions (answer from the run context only) make the agent decline before it reaches a tool, so the confinement is never tested. The reply's wording alone would pass the step ("lies outside the directories the agent may read"), so only the decision line shows the difference. Recorded as **not observed** per the spec's "the agent declined to try".
- **Suggested fix:** settle the `--restricted` row with a gate that drives `claude --restricted … -p` directly (asking for a `Read` of an absolute path outside the directory, and checking for the denial), or ask in step 11 for a file the agent has reason to read (one named in `run.md` but placed outside the context directory). Make the step's pass condition require the decision line or the log to show an attempted, refused read.

## 2. A refused commenter's job still installs claude and fetches the plugin — Low

- **What:** (xv)(d′). `expause-admin`'s mention on #31 (control `37584084036`) was refused correctly ("`@sdlc-harness` was not run: … HARNESS_RUN_ACTORS …"), with no `a mention on` line and no decision line, so no agent session ran and the credential was not used. But the job's step list is `… Set up Node: success`, `Install the claude CLI when absent: success` (`2.1.292 (Claude Code)`), `Fetch the pinned plugin: success`, `Act on the comment …: success`. The actor check lives in `remote-run.sh control`, the last step. The same holds for the (d) `status` refusal (`37584023156`).
- **Effect:** each refused comment from an unadmitted writer costs a full install and clone (~5–10 s of runner time) for nothing. No security effect: the credential is read only by the session, which never starts.
- **Suggested fix:** gate the install and fetch steps on the actor check (run it first as its own step and expose an output), or install and fetch lazily inside `remote-run.sh control` only once a mention has passed the actor check.

### 1. `push-branch.sh` refuses a workflow-file change only in a GitHub job; a local unattended run still pushes it

**File:** `cli/templates/scripts/push-branch.sh` (header paragraph `IN A JOB, A WORKFLOW-FILE CHANGE IS REFUSED AT THE FIRST PUSH.`; the send-check block) — "if [ -z \"$send_refusal\" ] && hr_push_credential_is_job_token \"$main_top\"; then" (near line 638)

**Problem.** The workflow-file refusal only runs when the job push-credential marker is set. That marker is `harness.pushCredential job-token` in the main `.git/config`, read through `lib/harness-run-lib.sh` → `hr_push_credential_is_job_token`, and only `remote-run.sh push-credential store` writes it. So the check runs in a GitHub job and nowhere else. A local unattended run still pushes a commit that changes `.github/workflows/<file>`, using the operator's own credential. That credential may carry the `workflow` scope that `init` asks for (`gh auth refresh -s workflow`, `docs/remote-execution.md` §7). The refusal was designed around one fact: the job's token *cannot* push a workflow file. The rule the user wants is different. An unattended run must never change CI, in any mode. Only an attacker would want that. An operator who wants a workflow edited makes the edit in a supervised session.

Every caller of `push-branch.sh` is an unattended run or a job step. The callers are the `*_autonomous` instruction forks, the committer's `push: true` (set only by those forks), the watcher, the shared docs, digest, observations and dispatch-additions pushes (each reached only from an autonomous fork's override), and `harness-run.yml`'s `Push the branch`. A supervised session pushes with its own `git push`. So the refusal can run on every call and needs no mode test.

**Fix.**

- [ ] **Refuse in every mode** (`cli/templates/scripts/push-branch.sh`). In the send-check block, drop the `hr_push_credential_is_job_token "$main_top"` condition. The path listing then runs whenever `send_refusal` is still empty after the credential scan, so the credential scan still wins when both hold. Keep everything else exactly as it is: the same `git log --name-only --no-renames -m --first-parent -z` listing, `first_workflow_path`, the root-only `HR_REMOTE_WORKFLOWS_DIR` prefix match (a nested `workflows/` directory such as `cli/templates/github/workflows/` stays an ordinary file), the fail-closed arm, `hr_push_refusal_record`, the second line naming the first path, and `exit 0`. The watcher already fails the run on any record, in both modes (`autonomous-watcher.sh` → `PUSH REFUSALS`), so it needs no change. Replace the refusal sentence with one that gives the supervised-only way on, not "run this task locally", for example:

  ```bash
  send_refusal="the commits to send change a file under $HR_REMOTE_WORKFLOWS_DIR/, and a workflow edit is supervised-only; nothing was pushed — review these commits and push them by hand, or rewrite them without that change"
  ```

- [ ] **Rewrite the header to match.** Rename the paragraph `IN A JOB, A WORKFLOW-FILE CHANGE IS REFUSED AT THE FIRST PUSH.` to `NO UNATTENDED PUSH CHANGES A WORKFLOW FILE.` and restate it:
  - Every caller is an unattended commit point or a job step, so the check runs on every call with no mode test. A supervised session pushes a workflow edit with its own `git push`.
  - In a local run the refusal keeps the operator's credential, which may carry the `workflow` scope, from changing CI. In a job, `github.token` could not push the change anyway, and an early refusal stops every later push of the run from failing.
  - A merge counts against its first parent. A refresh that merges in a workflow edit from the default branch is therefore refused too. Its way on is to push that merge by hand in a supervised session; once it is on the remote it is no longer among the commits to send.

  Delete the marker sentences ("The mode is the job push-credential marker …" through "`push-credential store` writes it through them") and "Such a task runs locally, where the push uses the operator's own credential." Keep the unmeasured-merge sentence. In the `EVERY FAILURE PATH IS NON-FATAL` paragraph, change "in a job commits to send that change a workflow file" to "commits to send that change a workflow file". In the REPRO, rename the `job workflow edit` row to `workflow edit`, drop its `git -C "$d" config harness.pushCredential job-token` line, and replace "the same commit without the marker pushes" with nothing. Update the comment above the send check ("then, in a job only, IN A JOB, A WORKFLOW-FILE CHANGE …") to cite the new paragraph name.

- [ ] **Retire the job push-credential marker, whose only reader this was.** Leaving it would leave an unread record documented as "how `push-branch.sh` knows it is in a job".
  - `cli/templates/scripts/lib/harness-run-lib.sh`: delete `HR_PUSH_CREDENTIAL_KEY`, `HR_PUSH_CREDENTIAL_JOB_TOKEN`, `hr_push_credential_is_job_token` and the `THE JOB PUSH-CREDENTIAL MARKER` section header. Keep `HR_REMOTE_WORKFLOWS_DIR` with its mirror comment, now read by "`push-branch.sh`'s workflow-file check". Fix the library's opening inventory ("answers whether a job's pushes authenticate with the stored job token (…)") and the source-time variable list ("the job push-credential marker's `HR_PUSH_CREDENTIAL_KEY`, `HR_PUSH_CREDENTIAL_JOB_TOKEN` and `HR_REMOTE_WORKFLOWS_DIR`" → "`HR_REMOTE_WORKFLOWS_DIR`").
  - `cli/templates/scripts/remote-run.sh`: in `push-credential store`, drop the third `git config --replace-all "$HR_PUSH_CREDENTIAL_KEY" …` and the "# The marker last" comment. In `erase`, drop the `--unset "$HR_PUSH_CREDENTIAL_KEY"` and its `unsetting the job push-credential marker failed` arm. Fix the `push-credential` header paragraph ("and, last, the job push-credential marker … cannot write `.github/workflows/`"; "and the marker are records the session cannot write"; "`--unset`s the marker first and the other two keys"). Fix the writes paragraph near line 1369: "three keys" → "two keys", and "removes … all three keys" → "both keys".
  - `cli/src/remote/githubActions.ts` header: "for `push-branch.sh`'s job workflow-file check" → "for `push-branch.sh`'s workflow-file check".

- [ ] **Docs the user named.**
  - `cli/templates/github/workflows/harness-run.yml` header, paragraph `A WORKFLOW-FILE CHANGE CANNOT BE PUSHED FROM THIS WORKFLOW.`: drop "while `push-credential store`'s marker is set" and "Run such a task locally." Say instead that a workflow edit is supervised-only: `push-branch.sh` refuses it in every unattended run, local or in a job, and here `GITHUB_TOKEN` could not push it anyway. Make the matching wording change in the `WHAT IT READS` bullet's cross-reference if it no longer reads right.
  - `docs/remote-execution.md`:
    - The upgrade note bullet "**A task that edits `.github/workflows/*` must run locally.** …" becomes "**Workflow edits are supervised-only.** `push-branch.sh` refuses the first push of a commit changing a file under `.github/workflows/` in every unattended run, local or in a job, and the run fails with that reason; make the edit in a supervised session."
    - In `## 11. Security`, the `A refused push, and where it shows` bullet: drop "in a job,".
    - The credential-design bullet: "three keys" → two, drop the marker clause, and drop the sentence "The marker, read from the same record, is how `push-branch.sh` knows it is in a job."
    - The issue-trigger bullet "A run whose task edits `.github/workflows/*` cannot push from a job at all, so run such a task locally. …": workflow edits are supervised-only in every unattended run. Keep the `GITHUB_TOKEN`/S1 fact as the job's additional reason, drop "while the job push-credential marker is set", and keep the root-only path rule and the refresh-merge sentence. Add the merge's way on (push it by hand in a supervised session). Keep roadmap item 35 for the GitHub question.
  - `docs/watcher.md` step 7: "or, in a GitHub job, a commit changing a file under `.github/workflows/`" → "or a commit changing a file under `.github/workflows/`, in every unattended run". Update the cited paragraph name to `NO UNATTENDED PUSH CHANGES A WORKFLOW FILE.` Keep the link to `remote-execution.md` → `## 11. Security`, but as the job's extra reason.

- [ ] **Other citations of the old paragraph and its job-only scope**, which would otherwise be false:
  - `docs/cli.md` (the excluded-scripts paragraph): "in a GitHub job only, commits that change a file under `.github/workflows/`" and the cited paragraph name.
  - `docs/sandbox-record.md`: §2 → "only where the main checkout carries the job push-credential marker, the refusal of …" and the cited paragraph name. In the residual "`push-branch.sh`'s two added steps are derived from the code", drop "with the job push-credential marker set" and "the job's workflow-file refusal".

- [ ] **Tests** (edit these files, which the unit then owns):
  - `cli/test/push-branch-credential-scan.test.mjs`:
    - Update the header rule. A workflow-file change never reaches the remote, with or without a job.
    - Update the `WORKFLOW` regex to the new sentence.
    - Remove `setMarker` and every call to it.
    - Turn `no marker: the same workflow commit pushes …` into a case asserting that the commit is refused, with `GITHUB_ACTIONS=true` and without.
    - In the delete and rename cases, seed the workflow file on origin with a plain `git push` under `NO_HOOKS` (as the merge case seeds `side`) instead of `f.push()`, which now refuses it.
    - Drop the `job:` prefixes. Keep the nested-directory, merge and credential-wins cases.
  - `cli/test/credential-scan-lib.test.mjs`: delete the `hr_push_credential_is_job_token …` case. Keep one assertion that `HR_REMOTE_WORKFLOWS_DIR` is `.github/workflows`, and fix the header's list.
  - `cli/test/remote-push-credential.test.mjs`: `store` sets two keys and no marker, and `erase` removes the entry and both keys. Remove `markerStatus` and its assertions, and fix the header and the case titles ("the three keys" / "all three keys").
  - `cli/test/watcher-push-refusal.test.mjs`: the fixture reason "…, which a job push may not; run this task locally" becomes the new sentence. It is only a fixture, but it should keep the producer's shape.

Do not edit `scripts/push-branch.sh` or `scripts/lib/harness-run-lib.sh` at the repository root. They are this checkout's own `init` output (`.claude/context/conventions.md` → `## Documents of record`), not the template an adopter receives.

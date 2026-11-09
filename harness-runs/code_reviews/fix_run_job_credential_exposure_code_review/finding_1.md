### 1. A `push-credential store` that writes nothing exits 0, so the `run` job starts a session that can never push and its commits are lost with the runner

**File:** `cli/templates/scripts/remote-run.sh` (`verb_push_credential`) — "if [ \"$pc_action\" = store ]; then"

The `run` checkout now sets `persist-credentials: false`, so the job's only push credential is the entry `remote-run.sh push-credential store` writes (`cli/templates/github/workflows/harness-run.yml` → step `Store the push credential outside the checkout`). Every arm of `store` that writes nothing still ends in `exit "$EXIT_OK"`:

- `push_credential_target_var` failing ("GITHUB_SERVER_URL is not https://<host>", "the checkout has no origin remote", "origin is not https://<host>/<path>"), reached through "nothing written";
- "GH_TOKEN is not set; nothing written" and "GH_TOKEN carries a newline; nothing written";
- "HOME is not an absolute path; nothing written" and "the store file path under HOME carries a character outside [A-Za-z0-9_./-]; nothing written";
- "writing the entry for https://$PC_HOST/$PC_PATH to $store_file failed; nothing configured";
- "setting the checkout's credential keys failed".

`setup_fail` also exits 0 for `push-credential` ("report, open, deliver, collect and push-credential, which never fail the step that calls them").

So the step succeeds, every later step runs, and `Run the harness` starts a session that may run for hours. Every in-session `push-branch.sh` call and the end-of-job `Push the branch` then fail authentication, and each prints only a `push failed for` line. That line is not a push-refusal record, so the watcher does nothing with it. When the runner is discarded, every commit the session made goes with it. Goal 2 of the task prompt ("Every commit made before the stop must already be on the remote") fails on every run where the store did not happen. A self-hosted runner whose `HOME` holds a space is enough to cause this (`cli/test/remote-push-credential.test.mjs` → "a HOME whose path carries a space stores nothing and sets no key"). Before this branch, a checkout with no usable credential failed at `actions/checkout` itself, before any session started.

**Fix:** make every `store` arm that leaves no usable credential exit non-zero. The step is not `continue-on-error`, so the job then fails before `Run the harness`, whose implicit `success()` condition skips it. `erase` keeps its always-0 contract.

1. In `verb_push_credential`, in the `store` branch only, and in its shared `push_credential_target_var` failure arm when `$pc_action` is `store`, replace each `exit "$EXIT_OK"` that follows a "nothing written", "nothing configured" or "setting the checkout's credential keys failed" line with `exit 1`. Print each of those lines as `::error::remote-run.sh: push-credential: store: …` instead of a bare or `::warning::` line. Keep the token out of every line, as now. The success arm ("stored the job token for …") keeps `exit "$EXIT_OK"`. The `erase` branch does not change.
2. In `setup_fail`, keep `push-credential` in the exit-0 list only for `erase`: change the condition so that `[ "$verb" != push-credential ] || [ "$pc_action" = erase ]` is what exempts it. A `store` that cannot resolve its repository then exits 1.
3. Amend the prose that states the old contract, in the same edit:
   - The header's **THE VERBS AND THE EXIT MAP** line `remote-run.sh push-credential store|erase … (always 0, 1 only on a usage error: its paragraph)` becomes `(store: 0 once the entry and its keys are written, 1 on a usage error or when it writes no usable credential; erase: always 0, 1 only on a usage error: its paragraph)`.
   - The `push-credential` paragraph's closing sentence "Every failure is one `::warning::` line; it always exits 0, and 1 only on a usage error (no `store|erase`, another word, a further argument or `--repo`)" becomes: "A `store` that writes no usable credential is one `::error::` line and exit 1, so the `run` job stops before its session, as a checkout with no credential would; every `erase` failure is one `::warning::` line and exit 0. Both exit 1 on a usage error (no `store|erase`, another word, a further argument or `--repo`)."
   - The `setup_fail` doc comment names `push-credential erase` instead of `push-credential`.
4. In `cli/test/remote-push-credential.test.mjs`, the cases "a HOME whose path carries a space stores nothing and sets no key", "without GH_TOKEN nothing is written and no marker is set" and "a non-https origin writes nothing and sets no marker" assert `result.status` equal to `1` instead of `0`. Their on-disk assertions stay as they are. That test file is the one this fix edits, so it is the only test the fix runs.

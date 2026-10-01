### Task 2 — Make the trigger comment name the run whose `headSha` is the commit `start` pushed

**Goal:** Make `remote-run.sh trigger` comment the URL of the run it just dispatched, or, when that run is not found, the branch's filtered run list. It must never comment the URL of an older `harness run <branch>` run. Today `trigger_run_url` takes the first of the five newest runs carrying that title, with nothing tying the run to this dispatch.

**Depends on:** Task 1, which edits other sections of the same `cli/templates/scripts/remote-run.sh`. This task uses no interface from Task 1. It applies the same lineage idea (a run is identified by its `headSha`) to the trigger's own lookup.

**Where this task stops.** It changes the comment lookup only. The trigger's name derivation, and passing `gh` into it, are Task 4's. The prose in `docs/github-issue-trigger.md` is Task 11's.

### Targets

- `cli/templates/scripts/remote-run.sh`: `trigger_run_url`, the one call site in `verb_trigger`, and the header's `` `trigger` IS THE GITHUB EVENT ADAPTER `` paragraph ("After a start it looks up …").
- `cli/test/remote-trigger.test.mjs`: its `STUB`'s `run list` answer, its file header, and two new cases.

**The interface this task defines, which Tasks 4 and 11 rely on:**

- **`trigger_run_url <sha>`** prints one URL and never fails.
  - When `<sha>` is non-empty, it looks up at most `TRIGGER_RUN_LOOKUP_TRIES` times, waiting `HARNESS_TRIGGER_LOOKUP_SECS` between tries. Each try runs `gh run list --workflow harness-run.yml --branch <branch> --json url,displayTitle,headSha --limit 5` and takes the first run whose `displayTitle` is `harness run <branch>` **and** whose `headSha` equals `<sha>`.
  - Otherwise it prints the filtered-list URL `…/actions/workflows/harness-run.yml?query=branch%3A<branch>`, exactly as today's fallback does.
  - When `<sha>` is empty, it makes no lookup and prints the filtered-list URL.
- **`verb_trigger`**, after a `start` that exited 0, reads `<sha>` with `git -C "$root" rev-parse --verify --quiet "refs/remotes/origin/$branch^{commit}"`. That is the ref `start`'s `hr_push_landed` confirmed equal to the pushed `HEAD`; `start_remove_copy` deletes only the local branch. A failed read leaves `<sha>` empty.

**Work:**

- [ ] **`trigger_run_url`**: take `<sha>` as its argument. Add `headSha` to the `--json` list and match on title **and** `headSha` in the jq. With no `<sha>`, skip straight to the fallback. Its doc comment states why `headSha` rather than `createdAt`: it identifies the dispatch exactly and does not depend on the runner's clock. A `createdAt` lower bound would still admit an unrelated run created in the same second.
- [ ] **`verb_trigger`**: read the remote-tracking SHA after `start` succeeds and pass it as `url=$(trigger_run_url "$sha")`. Change none of the comment or summary texts.
- [ ] **Header.** Amend the `trigger` paragraph's lookup sentence to name the `headSha` match and to say that the comment never names an older run.
- [ ] **`cli/test/remote-trigger.test.mjs`**:
  - Change the `STUB`'s `run list` answer so a case can script it per call. Keep the existing default, one `harness run <branch>` run with a `url`, but give it the `headSha` of `origin/<branch>`. The stub can read that ref from the fixture's bare origin, whose path the test passes in through an environment variable. This keeps every existing case's comment assertion green.
  - Add two acceptance cases.
    - **(a) The dispatched run appears on the second lookup.** The first `run list` call answers only an **older** matching run with a different `headSha`; the second answers that run plus the dispatched run (`headSha` = `origin/<branch>`). Expected: the comment names the dispatched run's URL, not the older one.
    - **(b) The dispatched run never appears.** Every call answers only the older run. Expected: the comment names `…/actions/workflows/harness-run.yml?query=branch%3A<branch>`.
  - Amend the file header's stub description to match.

**Verification:**

- `npm test -- test/remote-trigger.test.mjs` from `cli/` passes, with both new cases and every existing case.
- The type check passes.
- `HARNESS_TRIGGER_LOOKUP_SECS=0` is set in both new cases, so neither waits.

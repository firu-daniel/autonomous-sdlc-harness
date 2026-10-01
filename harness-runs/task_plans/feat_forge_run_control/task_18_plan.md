### Task 18 — Ask GitHub about the control workflow, the pull-request setting and the effective trigger label

**Goal:** Under `doctor --check-github`, `remote-github` asks GitHub three more things where the forge coupling applies:

1. Whether it knows `harness-control.yml`.
2. Whether the job's own token may open the draft pull request. That is the *Allow GitHub Actions to create and approve pull requests* setting, off by default and unreadable from a workflow, but readable from a person's `gh` (research S4).
3. Whether the label that actually starts a run exists. The label is the `HARNESS_TRIGGER_LABEL` variable, or else the label the **committed** `harness-trigger.yml` falls back to, which is `harness` in a repository wired by the previous release. This is how `doctor --check-github` reports a label that does not match the workflow's default (goal 8).

**Depends on:**

- Task 1's `WORKFLOW_CONTROL_FILE` in `cli/src/remote/githubActions.ts`.
- Task 2's `DEFAULT_TRIGGER_LABEL = 'sdlc-harness'` and `LEGACY_TRIGGER_LABEL = 'harness'`, and the trigger workflow's `if:` shape `github.event.label.name == (vars.HARNESS_TRIGGER_LABEL || '<label>')`.
- Task 6's rule: `deliver` opens the pull request with `HARNESS_GIT_TOKEN` when that secret is set, so the setting matters only without it.

**Where this task stops.** The offline `forge` check is Task 17's. Neither check ever writes the setting or creates a label. The state labels are created on first use and are not checked here.

### Targets

- `cli/src/remote/githubActions.ts` — a pure reader of the committed trigger workflow's fallback label.
- `cli/src/doctor/checks.ts` — `REMOTE_GITHUB_CHECK`, its doc comment, and one endpoint constant.
- `cli/test/remote-names.test.mjs` — the reader.
- `cli/test/doctor.test.mjs` — the new `remote-github` cases.

**Work:**

- [ ] **`triggerFallbackLabel(text: string): string | undefined`** in `githubActions.ts`. It is pure, as `renderedCliVersions` is, and the caller reads the file. It returns the single-quoted literal of the first line matching `(vars.${TRIGGER_LABEL_VARIABLE} || '<label>')`, and `undefined` when none matches. Its doc comment says why it exists: the committed trigger workflow carries no pin and is never upgraded, so its fallback is what starts a run when the variable is unset. `remote-names.test.mjs` asserts it on the current template, which gives `sdlc-harness`, on the previous release's `if:` line spelled in the test, which gives `harness`, and on a file with no such line, which gives `undefined`.
- [ ] **The control workflow**, inside `forgeTriggerApplies`: `gh workflow view ${WORKFLOW_CONTROL_FILE}`, graded as the trigger's — a refusal or an unknown is a `warn`, with the push remedy, and a known one joins the confirmation clause. Today that clause reads *"GitHub knows harness-trigger.yml and the label `<x>` exists"*; it becomes *"GitHub knows harness-trigger.yml and harness-control.yml, and the label `<x>` exists"*. It still appears on every outcome that reaches these reads, `fail` and `warn` included (`docs/development.md` → Gate 12 round 5, finding 2, the rule `fix_forge_trigger_run_lineage` fixed).
- [ ] **The effective label.** When the variable is empty, read the repository's committed `.github/workflows/harness-trigger.yml` (`WORKFLOW_TRIGGER_PATH`) with `triggerFallbackLabel`. Use its answer, else `DEFAULT_TRIGGER_LABEL` when the file is absent or unreadable, as the label whose existence `gh label list` is asked about. When that fallback is `LEGACY_TRIGGER_LABEL`, add a **note**, not a warning, since it works:
  - the trigger workflow was written by an earlier release and falls back to `harness`, which keeps starting runs;
  - `init --force` re-renders it and the scripts to `sdlc-harness`;
  - setting `HARNESS_TRIGGER_LABEL` keeps a name of your choosing under either.
- [ ] **The pull-request setting.** Add `PR_SETTING_ENDPOINT = 'repos/{owner}/{repo}/actions/permissions/workflow'` beside `ARTIFACT_RETENTION_ENDPOINT`, and ask `gh api` it, inside `forgeTriggerApplies`. Grade it:
  - `can_approve_pull_request_reviews` false, with `HARNESS_GIT_TOKEN` not among the secret names → a `warn`: a completed run cannot open its draft pull request with the job's token. Name the settings path and the `HARNESS_GIT_TOKEN` alternative.
  - false with `HARNESS_GIT_TOKEN` set → a note that the pull request opens with that token.
  - true → nothing.
  - a refused read → a note that the setting was not checked, as for retention: it may need more access than the caller has (S4).
  - an unknown answer, or a shape not understood → *cannot tell*, a `warn`.

  The doc comment's grade list gains every new finding.
- [ ] **`doctor.test.mjs`**, through the existing `answerTriggerGh` stub, extended with `workflow view harness-control.yml` and the `api` read:
  - control workflow refused → a warn naming it;
  - both known and the label present → the confirmation names both workflows;
  - a setting of false with no `HARNESS_GIT_TOKEN` → a warn naming the setting;
  - false with the secret → a note;
  - a 403 → a not-checked note;
  - a committed trigger workflow whose `if:` falls back to `harness`, with the variable unset → `gh label list` asked about `harness`, and the legacy note;
  - the current template's fallback → asked about `sdlc-harness`, and no note;
  - with the trigger not applying, none of these calls is made.

**Verification:**

- `npm test -- test/remote-names.test.mjs test/doctor.test.mjs` from `cli/` passes.
- `git grep -n "actions/permissions/workflow" -- cli/src` has its only code hit in `PR_SETTING_ENDPOINT`'s declaration: one owner of the path.

### Task 6 — Add the summary table and the refuted-leads section, and check the document against the acceptance list

**Goal:** Insert `## Summary` after `## How this was researched`, and append `## 6. Leads this research refutes` at the end of `docs/github-integration-research.md`. Then check the finished document, and the branch, against the task prompt's six acceptance criteria.

**Depends on:** Tasks 1–5. They wrote every entry with its own `**Verdict:**` line (sections 1–4) and the brief routes record (section 5). This task **builds both of its sections from what those entries say**. Where the rows below and an entry's `**Verdict:**` line disagree, the entry wins, and the disagreement is reported in this task's return — it is not silently resolved.

**Where this task stops.** It edits no entry of sections 1–5, except to fix a defect the acceptance check finds (a missing ID, or a missing source or measurement on a non-`unverified` entry). Each such fix is named in the return.

**How this task's implementer reads the conventions.** Catch-all layer: read `.claude/context/conventions.md`. For the closing check, read `## The testing bar`, where `bash scripts/run-gates.sh` is the automatable gate set and the self-containment gate binds every commit.

### Targets

- `docs/github-integration-research.md` — insert `## Summary`, and append `## 6. Leads this research refutes`.

**Work:**

- [ ] Insert `## Summary` directly after `## How this was researched`. It holds one sentence naming the three abbreviations used in the table's last column — *triggers* = `feat_forge_run_triggers`, *control* = `feat_forge_run_control`, *adoption* = `feat_github_native_adoption` — then the table below. Each ID in the table links to its entry heading's anchor.
- [ ] Before inserting the table, compare every row's verdict with that entry's `**Verdict:**` line (grep `-A2 '^### '` over the file). Take the entry's word where they differ, and note the difference for the return.
- [ ] Append `## 6. Leads this research refutes`. It holds one sentence stating what counts as a refuted lead: a lead the entry's evidence shows wrong, wholly or in part, is listed; a lead that holds is not. A second sentence says the `feat_github_native_adoption` items are kept although that branch was dropped on 2026-09-30, so its prompt is not revived with them. Then the list below, in its order: each item quotes the lead, names its prompt and the heading the lead sits under there, cites the entry, and states what is true instead. After the list, add a short `### Removed by decision, not refuted` with A10.
- [ ] Run the acceptance check. Confirm that every question ID S1–S6, T1–T6, C1–C4 and A1–A12 has an entry with a verdict. Confirm that every entry whose verdict is not `unverified` carries a URL with a retrieval date and a quote, or a measurement. Confirm that section 5 gives a count for every route. Confirm that every item of section 6 names its lead and its prompt. Confirm that `git diff --name-only $(git merge-base HEAD origin/main) -- . ':(exclude)harness-runs'` lists only `docs/github-integration-research.md`.
- [ ] Run `bash scripts/run-gates.sh` without a pipe, and record its result against the gates' state on `main`: the branch must add no new failure. Then grep the document for `/Users/`, `/private/`, `/tmp/` and `scratchpad`.

### Summary table rows (verdicts as the entries state them)

| ID | Question | Verdict | Prompts affected |
|---|---|---|---|
| S1 | Can `GITHUB_TOKEN` write `.github/workflows/*`? | `verified` | triggers, adoption |
| S2 | Which tokens can write workflow files, and how they expire | `partly true` | control, adoption |
| S3 | Which `GITHUB_TOKEN` events start other workflows | `partly true` | triggers, control, adoption |
| S4 | The "create and approve pull requests" setting | `verified` | control, adoption |
| S5 | `workflow_dispatch` input count and payload limits | `verified` | control, adoption |
| S6 | Maximum comment body length | `verified` | control |
| T1 | `issues` types, the role to label, `sender` on `labeled` | `verified` | triggers |
| T2 | Secrets and a write token for an `issues` workflow | `partly true` | triggers |
| T3 | The collaborator-permission API | `partly true` | triggers, control |
| T4 | What `anthropics/claude-code-action` checks | `verified` | triggers, control |
| T5 | Branch-name rules for a derived slug | `partly true` | triggers |
| T6 | Jira → `repository_dispatch`; GitLab | `partly true` | triggers |
| C1 | Review events, states, and a review's inline comments | `verified` | control |
| C2 | Fork PRs, and `pull_request_target` | `verified` | control |
| C3 | A draft PR from `GITHUB_TOKEN` | `verified` | control, adoption |
| C4 | Prior art for comment commands | `partly true` | control |
| A1 | Reusable workflows against composite actions | `partly true` | adoption |
| A2 | Marketplace listing | `partly true` | adoption |
| A3 | Disabling one trigger of a multi-trigger workflow | `verified` | adoption |
| A4 | The prefilled new-file link | `partly true` | adoption |
| A5 | Workflow templates and other no-checkout routes | `partly true` | adoption |
| A6 | GitHub Apps, a thin relay, hosting cost | `verified` | adoption |
| A7 | Copilot agents and Copilot Extensions | `partly true` | adoption |
| A8 | The Claude GitHub App | `partly true` | adoption |
| A9 | GitHub Codespaces | `partly true` | adoption |
| A10 | Claude Code on the web | `unverified` | adoption |
| A11 | A subscription token without the CLI | `verified` | adoption |
| A12 | The `.claude/**` wall on the current Claude Code | `verified` | adoption |

### Refuted leads (in this order)

1. **`feat_forge_run_control`**, *Leads* › *Opening PRs from a job*: *"A PR opened, or a push made, with `GITHUB_TOKEN` starts no other workflow, so the adopter's CI does not run on the draft PR."* True of the push. Since 2026-06-11 a PR opened with `GITHUB_TOKEN` creates `pull_request` runs that wait for a person with write access to approve them. Measured as `action_required` (S3).
2. **`feat_github_native_adoption`**, *Leads* › *Opening pull requests from a job*: *"Pushes and PRs made with `GITHUB_TOKEN` start no other workflow."* The same correction (S3).
3. **`feat_github_native_adoption`**, *Leads* › *Workflow files and `GITHUB_TOKEN`*, candidate (a): *"It costs the adopter one more secret, and it expires"*. A fine-grained PAT may be created with no expiry unless an organisation policy caps it (the organisation default is 366 days), and a classic PAT's expiry is optional (S2).
4. **`feat_github_native_adoption`**, *Options to evaluate*: *"A reusable workflow or composite action published on the GitHub Actions Marketplace."* A reusable workflow cannot be published to the Marketplace; only an action (a composite action included) or an app can (A2).
5. **`feat_github_native_adoption`**, *Options to evaluate* › *A browser-hosted development environment: GitHub Codespaces*: *"A button in the harness README, or a `devcontainer.json` the setup adds, opens a Codespace on the adopter's repository."* A `codespaces.new` link opens the repository it names. So a button in the harness README opens the harness repository, not the adopter's. A `devcontainer.json` in the adopter's own repository is unaffected (A9).
6. **`feat_github_native_adoption`**, *Options to evaluate* › *A prefilled new-file link*: *"so adding the file is one click plus a commit"*. It holds only for a small file. From a URL of about 9.5 KB, GitHub returns `Whoa there! Your request URL is too long.`, which rules out today's 24 KB `harness-run.yml`. The commit is two clicks (A4).
7. **`feat_github_native_adoption`**, *Options to evaluate* › *Copilot and GitHub's agent integrations*: *"Copilot Extensions, which as far as is known are being retired in favour of MCP"*. They are already retired: disabled on 2025-11-10. The *"Copilot coding agent"* is now named the Copilot cloud agent, and it is billed in AI credits, not premium requests (A7).
8. **`feat_github_native_adoption`**, *Leads* › *Workflow files and `GITHUB_TOKEN`*, candidate (c): *"a GitHub App's installation token with the *Workflows* permission, whether an app of the harness's own or Anthropic's Claude app"*. Anthropic's app is not a candidate. Its installation token can be minted only with Anthropic's private key, and its *Workflows* permission is stated both ways by Anthropic's own sources (A6, A8).

`### Removed by decision, not refuted`: **A10**, the *Claude Code on the web (claude.ai/code)* option of `feat_github_native_adoption`. The maintainer dropped it on 2026-09-30 so that adoption uses GitHub's own surfaces (A10).

**Verification:**

- `## Summary` sits between `## How this was researched` and `## 1. Shared: GitHub Actions and tokens`. It has 28 rows, one per ID, and each verdict equals its entry's `**Verdict:**` word.
- `## 6. Leads this research refutes` is the last section. It has the eight items and the A10 note.
- The acceptance check's five confirmations pass. `bash scripts/run-gates.sh` shows no failure that `main` does not also show. The machine-path grep prints nothing.

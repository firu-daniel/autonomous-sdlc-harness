### Task 4 — Record the adoption entries A1–A12 briefly

**Goal:** Append `## 4. Adoption — feat_github_native_adoption (dropped)` to `docs/github-integration-research.md`. It opens with one paragraph recording that branch's drop, then holds brief entries A1–A12 in the story index's entry shape, carrying exactly the verdicts, answers, evidence and consequences below.

**Depends on:** Task 3, which appends `## 3. Control — feat_forge_run_control`. This task appends section 4 after it, cites S-, T- and C-entries by ID where the entries below name them, and edits nothing earlier tasks wrote.

**Why brief.** The maintainer dropped `feat_github_native_adoption` on 2026-09-30, during this branch's planning, after reading these findings. Codespaces was the only route that covered the supervised analysis and a subscription credential, and it costs more actions than the local install it would replace. Each entry below keeps what the acceptance list needs — a verdict, a short answer, and at least one source with its date and quote, or a measurement — and the single fact most likely to matter if the idea returns. Each consequence is one line.

**How this task's implementer reads the conventions.** Catch-all layer: `.claude/context/conventions.md` → `## Documents of record` and the self-containment gate under `## The testing bar`. Mark A4 and A9 evidence as the maintainer's observations, as `## How this was researched` defines. The A12 scratch repository is "a scratch git repository", never a path.

### Targets

- `docs/github-integration-research.md` — append section 4.

**Work:**

- [ ] Append `## 4. Adoption — feat_github_native_adoption (dropped)` after section 3. Under it, write the paragraph from *Section opening* below.
- [ ] Write A1–A6 from the finding blocks below.
- [ ] Write A7–A12.
- [ ] Re-read every quote and measured line against this task file character for character; grep the file for `/Users/`, `/private/`, `/tmp/` and `scratchpad`.

### Section opening

`feat_github_native_adoption` — adopting and running the harness from GitHub alone, with nothing installed locally — was dropped by the maintainer on 2026-09-30, during the planning of this research. The findings below are why: every GitHub-only route needs a codespace (A9) as soon as a subscription credential (A11) or the supervised analysis (A12) is involved. A codespace setup session costs more of the adopter's actions than the local install (§ 5), for an adopter who has a machine. The entries are kept as a brief record, so that the question does not have to be researched again if it returns.

### Finding blocks

#### A1. Reusable workflows against composite actions: secrets, `permissions`, `concurrency`, nesting, `schedule` in a called workflow, pinning and Dependabot.

**Verdict:** `partly true` — all documented except whether a called workflow's own `schedule` trigger runs.

**Answer:** `secrets: inherit` works only within one organisation or enterprise, so a caller under another owner passes each secret by name. A called workflow can only lower the caller's permissions. Workflows nest ten levels deep. A composite action cannot read `secrets` at all. A caller can pin `@v1`, and Dependabot updates reusable-workflow references.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idsecretsinherit — retrieved 2026-09-30: "The `inherit` keyword can be used to pass secrets across repositories within the same organization, or across organizations within the same enterprise."
- https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#limitations-of-reusable-workflows — retrieved 2026-09-30: "The `GITHUB_TOKEN` permissions passed from the caller workflow can be only downgraded (not elevated) by the called workflow."
- https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot — retrieved 2026-09-30: "When you enable Dependabot version updates for GitHub Actions, Dependabot will help ensure that references to actions in a repository's *workflow.yml* file and reusable workflows used inside workflows are kept up to date."

**Consequence:** none now; it would shape thin callers if the idea returns.

#### A2. GitHub Marketplace: can a reusable workflow be listed, or only an action?

**Verdict:** `partly true` — only an action (or an app) can be listed, not a reusable workflow.

**Answer:** A reusable workflow cannot be published to the Marketplace. An action, including a composite action, can be listed from a public repository with one root `action.yml`. A listing installs nothing into the adopter's repository.

**Evidence:**
- https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations#key-differences-between-reusable-workflows-and-composite-actions — retrieved 2026-09-30, table row (reusable | composite): "Cannot be published to the marketplace | Can be published to the marketplace".

**Consequence:** none now.

#### A3. Does disabling a workflow file disable every trigger in it?

**Verdict:** `verified`

**Answer:** Yes. Once `probe-disable.yml` was disabled, its `workflow_dispatch` was refused and neither a label nor a matching push started it. Re-enabled, the label started it again. So the resume poller, which disables itself, must stay a file of its own, as `harness-resume.yml` already is.

**Evidence:**
- Measurement, Gate 12, 2026-09-30 10:17 UTC, maintainer's `gh`: `gh workflow disable probe-disable.yml` → state `disabled_manually`. `gh workflow run probe-disable.yml` → `could not create workflow dispatch event: HTTP 422: Cannot trigger a 'workflow_dispatch' on a disabled workflow`. A label at 10:17:17Z and a push of `probe-a3/one` at 10:17:20Z each started the listener but not `probe disable`. After `gh workflow enable`, a label at 10:17:32Z started `probe disable` at 10:17:33Z.
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows — retrieved 2026-09-30: "Disabling a workflow allows you to stop a workflow from being triggered without having to delete the file from the repo."

**Consequence:** none now; the existing poller already has its own file.

#### A4. Does GitHub's `…/new/<branch>?filename=…&value=…` link prefill a new file, and up to what length?

**Verdict:** `partly true` — it prefills, but only while the URL stays under roughly 7–9.5 KB.

**Answer:** Observed by the maintainer: values up to 6,000 characters (URL 7,151) prefilled. From 8,000 (URL 9,499), GitHub showed `Whoa there! Your request URL is too long.` Today's `harness-run.yml` template (URL 40,224) does not fit. Committing takes two clicks.

**Evidence:**
- Observation by the maintainer, 2026-09-30 ~10:10 UTC, links to `https://github.com/firu-daniel/harness-gate12/new/main?filename=.github%2Fworkflows%2Fprobe-a4.yml&value=<URL-encoded text>`: value 120 / 2,000 / 4,000 / 6,000 characters (URL 267 / 2,467 / 4,815 / 7,151) → the editor opened with filename and content filled. Value 8,000 and above (URL 9,499 and above), and the 24,207-character `harness-run.yml` template (URL 40,224) → `Whoa there! Your request URL is too long.` Committing the 120-character file: **Commit changes…**, then **Commit changes** in the dialog.

**Consequence:** none now.

#### A5. Workflow templates, template repositories, and other ways to add a workflow without a checkout.

**Verdict:** `partly true` — workflow templates are documented only for organisations, and template repositories help only a repository created from them.

**Answer:** Workflow templates live in an organisation's `.github` repository and appear only in that organisation's **New workflow** picker. A template repository copies its files into a new repository. For an existing repository, what remains is the web editor (A4), a token with workflow permission (S2), or a codespace (A9).

**Evidence:**
- https://docs.github.com/en/actions/how-tos/reuse-automations/create-workflow-templates — retrieved 2026-09-30: "If it doesn't already exist, create a new  repository named `.github` in your organization." (the double space is the page's)
- https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository — retrieved 2026-09-30: "After you make your repository a template, anyone with access to the repository can generate a new repository with the same directory structure and files as your default branch."

**Consequence:** none now.

#### A6. GitHub Apps: what one needs hosted, the *Workflows* permission, a thin relay, and hosting cost.

**Verdict:** `verified`, except the permission's UI wording.

**Answer:** Receiving webhooks needs a server, and minting installation tokens needs the app's private key. A relay app hosted by the harness could dispatch runs without holding any adopter's credential, but it would hold a key that reaches every installation. Hosting starts at $0 on Cloudflare Workers Free, capped at 10 ms CPU per request, or $4 a month for a droplet. The adopter's own workflows already receive issue, comment and review events without an app.

**Evidence:**
- https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app — retrieved 2026-09-30: "The private key for your GitHub App grants access to every account that the app is installed on. It **must** be stored securely and never shared broadly."
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app — retrieved 2026-09-30: "If your app specifically needs to access or edit Actions files in the `.github/workflows` directory, request the "Workflows" repository permission."
- https://developers.cloudflare.com/workers/platform/pricing/ — retrieved 2026-09-30, Workers Free row: "100,000 per day | No charge for duration | 10 milliseconds of CPU time per invocation".

**Consequence:** none now. Triggers and control need no app, because workflows receive the events directly (T1, C1).

#### A7. Copilot cloud agent, third-party coding agents on GitHub, Copilot Extensions.

**Verdict:** `partly true` — none documents a way to run this harness, and two details of the lead are dated.

**Answer:** All three run the vendor's agent under Copilot billing, now AI credits plus Actions minutes. None documents a custom plugin, permission profile or launch line. The third-party Claude agent "uses the Claude Agent SDK". Copilot Extensions were disabled on 2025-11-10.

**Evidence:**
- https://docs.github.com/en/copilot/concepts/agents/anthropic-claude — retrieved 2026-09-30: "The Anthropic Claude coding agent uses the Claude Agent SDK and can be powered by your existing Copilot subscription."
- https://github.blog/changelog/2025-09-24-deprecate-github-copilot-extensions-github-apps/ — retrieved 2026-09-30: "November 10, 2025: Full sunset—all Copilot Extensions disabled".

**Consequence:** none.

#### A8. The Claude GitHub App: what it installs, its permissions, its credentials.

**Verdict:** `partly true` — the app itself installs nothing, but whether it holds *Workflows* write is stated both ways by Anthropic.

**Answer:** `/install-github-app` runs in the local CLI. It installs the app, saves `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` as a secret, and pushes a branch with `claude.yml` for a PR. On *Workflows*, code.claude.com lists "Read and write", while the action's FAQ says it has no workflow write access.

**Evidence:**
- https://code.claude.com/docs/en/github-actions#quick-setup — retrieved 2026-09-30: "Claude Code then pushes a branch with the workflow files you select, already set to use that secret, and opens GitHub in your browser with a pull request ready to create."
- https://code.claude.com/docs/en/github-actions#github-app-permissions — retrieved 2026-09-30, table row: "| Workflows | Read and write |".
- https://github.com/anthropics/claude-code-action/blob/main/docs/faq.md — retrieved 2026-09-30: "The GitHub App for Claude doesn't have workflow write access for security reasons."

**Consequence:** none.

#### A9. GitHub Codespaces: `claude` with the plugin, sign-in, `setup-token`, pushing workflow files, cost, a README button.

**Verdict:** `partly true` — all of it works, except that a README button cannot target the adopter's repository.

**Answer:** Observed by the maintainer:
- **Create:** a default codespace on Gate 12 took about 1 minute and 4 clicks.
- **Plugin:** the plugin installed at user scope, and `/autonomous-sdlc-harness:branch-status` ran.
- **Sign-in:** `claude` signed in by copying a URL into the browser and pasting back a code. `claude setup-token` used the same flow and succeeded.
- **Workflow files:** the codespace's token pushed a workflow-file change (S2).
- **Cost:** a 2-core machine is $0.18 an hour past the included 120 hours (Free).
- **Link:** a `codespaces.new/OWNER/REPO` link opens the repository it names.

**Evidence:**
- Observation by the maintainer, Gate 12 codespace, 2026-09-30 10:31–10:45 UTC: plugin install exit 0. Sign-in ended with `Login successful. Press Enter to continue…`. `claude setup-token` printed `✓ Long-lived authentication token created successfully!`. Commit `91a9e70`, changing `.github/workflows/probe-listen.yml`, was pushed by the codespace's `GITHUB_TOKEN` (S2).
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces — retrieved 2026-09-30, table row: "Codespaces compute | 2 core | 1 hour | 2 | $0.18".
- https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/setting-up-your-repository/facilitating-quick-creation-and-resumption-of-codespaces — retrieved 2026-09-30: "Create a codespace for the default branch of the repository: `https://codespaces.new/OWNER/REPO-NAME`".

**Consequence:** none now; it was judged not worth it against the local install, which it would merely relocate.

#### A10. Claude Code on the web (claude.ai/code).

**Verdict:** `unverified` — not researched, by the maintainer's decision.

**Answer:** The maintainer dropped this option on 2026-09-30, before any research, so as not to add a new entry point beyond GitHub.

**Evidence:**
- Maintainer's decision, planning session of this branch, 2026-09-30: "If A10 requires using `claude.ai/code`, we drop this option. We don't want to introduce a new entry point. We already have GitHub for some actions. Let's limit it to GitHub."

**Consequence:** none.

#### A11. A subscription token without running the `claude` CLI anywhere.

**Verdict:** `verified` — no such route exists.

**Answer:** `claude setup-token` and `/install-github-app` are the only documented ways to mint a subscription token, and both run in the CLI. Anthropic forbids third parties from intermediating Claude.ai sign-in. A codespace can serve as the machine (A9). An API key needs no CLI.

**Evidence:**
- https://code.claude.com/docs/en/legal-and-compliance — retrieved 2026-09-30: "Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow."
- https://code.claude.com/docs/en/github-actions#manual-setup — retrieved 2026-09-30: "Generate one by running `claude setup-token` locally."

**Consequence:** none now. `docs/remote-execution.md` → `### Every secret and variable` already asks for `claude setup-token`.

#### A12. The `.claude/**` sensitive-path wall on the current Claude Code, including Bash writes.

**Verdict:** `verified`

**Answer:** The wall is unchanged on 2.1.285. Under `claude -p … --permission-mode acceptEdits`, even with `Write(.claude/**)`, `Bash(printf:*)` and `Bash(cp:*)` allowed through `--settings`, three writes into `.claude/` were each refused as "a sensitive file": a `Write`, a `printf >` redirect and a `cp`. Each run exited 0 with nothing written. The same writes into `docs/` succeeded. Under `--dangerously-skip-permissions`, all three `.claude/` writes succeeded.

**Evidence:**
- Measurement, 2026-09-30 09:59–10:00 UTC, macOS (Darwin 24.6.0), `2.1.285 (Claude Code)`, model `haiku`, in a scratch git repository. The command, one step per invocation: `claude -p "<step>" --model haiku --output-format json --permission-mode acceptEdits --settings <profile>`. The profile allowed `Write(.claude/**)`, `Edit(.claude/**)`, `Bash(cp:*)` and `Bash(printf:*)`. The `Write`, `printf three > .claude/probe-bash.md` and `cp README.md .claude/probe-cp.md` steps each exited 0 with one `permission_denials` entry and wrote nothing. The Write result read `Claude requested permissions to edit <repo>/.claude/probe-write.md which is a sensitive file.` The three control writes into `docs/` exited 0 with `permission_denials: []`. With `--dangerously-skip-permissions`, all three `.claude/` writes succeeded.
- https://code.claude.com/docs/en/permission-modes#protected-paths — retrieved 2026-09-30: "`permissions.allow` rules in settings files do not pre-approve protected-path writes. The safety check runs before Claude Code evaluates allow rules from settings, so an entry such as `Edit(.claude/**)` in `~/.claude/settings.json` or `.claude/settings.json` does not change the per-mode outcome in the table above."

**Consequence:** none for the other two branches. `docs/analyze.md` → `## 3. What it may write` records the same wall on 2.1.237; this measurement extends it to 2.1.285 and to Bash. This branch does not edit that file.

**Verification:**

- Section 4 follows section 3. It opens with the drop paragraph, then holds A1–A12 in the entry shape, in ID order.
- Every entry whose verdict is not `unverified` carries a URL with its date and a quote, or a measurement or observation.
- Every quote matches this task file character for character, and the machine-path grep prints nothing.

# Skeptic Review: feat_unattended_bash_sandbox

## Context

**Branch:** `feat_unattended_bash_sandbox`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev` (`git diff dev...HEAD`), 97 files. The review covered the sandbox and write-protection generators, the two unsandboxed wrappers and their run-library checks, the `<MAIN_REPO>` push spelling across the plugin corpus, the watcher's permission mode and the remote job's launch path. The task prompt and the story index were treated as claims to verify. 53 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** the code review (`harness-runs/code_reviews/feat_unattended_bash_sandbox_code_review.md`, Findings 1–7), the architecture review (`harness-runs/architecture_branch_reviews/feat_unattended_bash_sandbox_arch_review.md`, Findings 1–6) and `harness-runs/lessons.md`. `phases.parity` is `false`, so no parity review exists and check 2's parity leg does not apply.

**Headline.** Two net-new defects, each reproduced against the shipped files in a throwaway fixture.

- **Finding 1.** The branch moved the agent-issued push to the main checkout's absolute path. The script-allowlist guard does not grant that path from a worktree session, and it is the layer the corpus relies on for an invocation that carries `"$REPO_ROOT"`. Ten push sites therefore depend on a profile match that the repository itself documents as unavailable for a command carrying a shell expansion. Under `dontAsk`, an unmatched push is refused, and each flow treats its push as best-effort and carries on. The committer already spells both paths literally, which is the fix.
- **Finding 2.** The main checkout's `refresh-branch.sh` runs unsandboxed. It passes the worktree's `defaultBranch` straight to `git fetch`. That file is sandbox-writable, so a value starting with `--upload-pack=` makes git run a program of the run's choosing outside the sandbox. This is code-review Finding 6's class at a site that fix did not reach.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational, and the committer never touches them. Each entry resolves to `harness-runs/skeptic_reviews/feat_unattended_bash_sandbox_skeptic_review/finding_<K>.md`. The leading number is the ship order and the `K` is the finding's stable identity.

1. [ ] **Finding 2** — Refuse a `defaultBranch` starting with `-` in `refresh-branch.sh` before it reaches `git fetch` _(layer: cli)_
2. [ ] **Finding 1** — Spell the worktree argument of every `<MAIN_REPO>` push literally, as the committer does, instead of `"$REPO_ROOT"` _(layer: plugin)_

---

## Must Fix

### 1. From a worktree, the script-allowlist guard does not grant the `<MAIN_REPO>` push spelling, so ten `"$REPO_ROOT"` push sites rely on a profile match the repository says cannot happen
→ [finding_1.md](feat_unattended_bash_sandbox_skeptic_review/finding_1.md)

---

## Should Fix

### 2. The unsandboxed `refresh-branch.sh` passes the sandbox-writable `defaultBranch` to `git fetch`, where `--upload-pack=` runs a program outside the sandbox
→ [finding_2.md](feat_unattended_bash_sandbox_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so no reference implementation exists and this section has no divergence entries. The two-leg test was applied to the branch's own declared omissions, and both legs passed in each case:

- The three credential files left readable: `~/.npmrc`, `~/.gitconfig`, `~/.zshenv`. The cited roadmap item 21 exists in `docs/development.md` → `## 6`.
- `network.allowLocalBinding` is left ungraded by `doctor`.

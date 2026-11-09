### Task 4 — Drive `branch-protection` end to end against a stubbed `gh`: covered, not covered, partially covered, unreadable

**Goal:** Prove through the compiled CLI that `branch-protection` asks GitHub only under `--check-github` and only with `forge` `github`, and that it reads only. It must pass on proven coverage, warn naming the branch and what is missing on anything less, warn *cannot tell* where it could not read, and never move the exit status.

**Depends on:** Tasks 2 and 3, restated so this suite needs neither file.

- **The check (Task 2).** Its id is `branch-protection`, and it sits in `CHECKS` after `forge`. Under `doctor --check-github` with `forge: github` it runs `gh auth status`. Then, per concrete protected branch `<b>`, it runs `gh api repos/{owner}/{repo}/rules/branches/<b>?per_page=100`. When those rules do not block all three, it also runs `gh api repos/{owner}/{repo}/branches/<b>/protection`.
- **What counts as blocking.** In the rules answer (a JSON array of `{ "type": … }`), `pull_request` or `update` blocks direct pushes, `non_fast_forward` blocks force pushes, and `deletion` blocks deletion. In the classic answer (a JSON object), `required_pull_request_reviews` present or `lock_branch.enabled: true` blocks pushes, `allow_force_pushes.enabled: false` blocks force pushes, and `allow_deletions.enabled: false` blocks deletion.
- **How refusals read.** A classic refusal whose `gh` stderr carries `Branch not protected` or `Branch not found` means *no classic protection*. Any other refusal means *cannot tell*.
- **Grades.** The check passes only when every concrete branch is covered and no glob entry exists. Every other state warns, including the default run (`not checked — run \`npx autonomous-sdlc-harness doctor --check-github\``), a non-`github` forge, a `gh` that does not spawn, and a `gh` that is not logged in.
- **Help text (Task 3).** `doctor --help` names `branch-protection` in the `--check-github` text.

### Targets

- `cli/test/doctor-branch-protection.test.mjs` (new): the suite.

**Work:**

- [ ] **Header and seams.** The header states the rule: *"GitHub is asked only under `--check-github` and only with `forge: github`, every call is a read, a pass is only a proven pass, cannot-tell is never graded as missing, and the check never fails."* It also states what is deliberately not covered: a real GitHub, and ruleset bypass actors.
  - Point `HARNESS_GH_CLI` at a file-local stub that logs its argv and answers from per-argv `out` / `err` / `status` / `kill` files, in the manner of `cli/test/doctor.test.mjs` → `answeringGhStub`. That copy is file-local, as `.claude/context/cli.md` → `## Not determined` permits a suite's own helper.
  - Build the fixture with `cli/test/helpers/fixture.mjs` (`createFixture`, `runCli`): `init`, then `config set forge github`, and `config set protectedBranches` where a case needs more than one branch or a glob. Every fixture lives under the system temp directory and is removed in process.
- [ ] **The gate cases.**
  - A default `doctor` with `forge: github` warns `branch-protection … not checked`, names `doctor --check-github`, logs no `gh` call and exits 0.
  - `--check-github` with `forge` `none`, and with `forge` unset, warns naming the forge state, makes no `branch-protection` call (no `rules/branches` or `/protection` path in the log), and exits 0.
  - `doctor --help` names `branch-protection` in the `--check-github` text.
- [ ] **The four answer families the task prompt names**, each under `--check-github` with `forge: github`:
  - **Covered by a ruleset:** the rules answer `pull_request`, `non_fast_forward`, `deletion` gives `PASS`, and no `/protection` call is made.
  - **Covered by classic protection:** the rules answer `[]` and a classic object blocking all three give `PASS`.
  - **Not covered:** the rules answer `[]` and classic `err: gh: Branch not protected (HTTP 404)`, `status: 1` give `WARN` naming the branch and direct pushes, force pushes and deletion.
  - **Partially covered:** the rules answer `[{ "type": "deletion" }]` and classic not protected give `WARN` naming the branch, direct pushes and force pushes, and not naming deletion as missing.
  - **Unreadable:** the rules are refused (`gh: Resource not accessible by integration (HTTP 403)`) and classic is refused (`gh: Not Found (HTTP 404)`). That gives `WARN` carrying *cannot tell*, and the line does not report those needs as missing.
  - With two protected branches, one covered and one not, the line names only the uncovered one as lacking protection.
- [ ] **Could-not-check and the never-fails bar.**
  - A `gh` that does not spawn gives `WARN` with the install remedy.
  - `gh auth status` refused gives `WARN` naming `gh auth login`.
  - A timed-out rules read (the stub's `kill`) gives `WARN` *cannot tell*.
  - A rules answer that is not JSON gives `WARN` *shape*.
  - A glob entry (`release/*`) gives `WARN` naming it as not checked, while the concrete branch is still read.
  - For every case in this file, assert that no logged argv carries `--method`, `-X`, `-f`, `-F`, `--field`, `--raw-field` or `--input`, that `branch-protection` never prints a `FAIL` line, and that the exit status is not moved by this check (0 wherever no other check fails).

**Verification:**

- `npm test --workspace cli -- test/doctor-branch-protection.test.mjs` passes. It is this task's own new test file.
- The suite's log assertions show `gh` was never invoked by a default run, so no case reaches the network or the machine's own `gh`.

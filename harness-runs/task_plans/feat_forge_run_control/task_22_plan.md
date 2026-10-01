### Task 22 — Restate `forge` in the schema, `ARCHITECTURE.md` and the `docs/config.md` row

**Goal:** The three places that state what `forge` does say the whole coupling is delivered for GitHub, and that `gitlab` still writes nothing (acceptance 8: *"`forge`'s row states that the whole coupling is delivered, or names what is still missing"*). Each currently says the draft pull request and comment-based park-and-ask are still to come.

**Depends on:** what Tasks 6, 13, 15 and 16 built, restated here. With `forge` `github` **and** `execution.target` `github-actions`:

- `init` writes `harness-trigger.yml` and `harness-control.yml`;
- the trigger starts a run from a labelled issue;
- `harness-control.yml` obeys `@sdlc-harness` comment commands and turns a review requesting changes into a user-review round;
- the run workflow posts lifecycle comments and keeps one `sdlc-harness: <state>` label on the issue and the pull request;
- a completed run gets a draft pull request.

The readers of the key are `init`'s workflow generator and, at run time, `remote-run.sh`'s `trigger`, `control`, `report` and `deliver`. Its reporter is `doctor`'s `forge` check. `push-branch.sh` still opens no pull request and consults no platform.

**Where this task stops.** The adopter-facing how-to is Tasks 23–26's. `docs/development.md` → `## 6.`'s debt paragraph and `ROADMAP.md` are Task 31's. `.claude/context/conventions.md`'s `## Not determined` bullet on `forge` is a conventions document and no task's target: it is raised in this plan's `## Corpus staleness` instead.

### Targets

- `schemas/harness.config.schema.json` — `properties.forge.description`.
- `ARCHITECTURE.md` — `## 7.`'s bullet "**No forge coupling beyond the issue trigger.**", and `## 8.`'s paragraph "**`forge` — the same pattern, declared missing one part and since completed.**", and `## 8.`'s `design.source` paragraph opening "**This declaration has the shape the rule above refuses**", its sentence *"For `forge` that outcome has since been paid for the key's trigger part — …"*.
- `docs/config.md` — `## 5. Key reference`, the `forge` row.

**Work:**

- [ ] **The schema description**: keep its first two sentences and its last, the no-default reason. Replace the middle, which reads *"'github', with execution.target 'github-actions', makes init write the issue-trigger workflow, which starts runs from labelled issues"*, with the whole coupling in one sentence. With `execution.target` `github-actions`, `github` makes `init` write the issue-trigger and run-control workflows: a labelled issue starts a run, comments and reviews steer it, lifecycle comments and state labels report it, and a completed run opens a draft pull request. `gitlab` writes nothing in this release. The model's field doc is a one-line condensation of this description (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, a configuration key); check that `cli/src/config/model.ts`'s `HarnessConfig.forge` doc does not contradict it, and leave it unchanged if it does not. Task 1 already restated `forgeTriggerApplies`.
- [ ] **`ARCHITECTURE.md` → `## 7.`**: the bullet's title becomes "**No forge coupling beyond GitHub.**" Its body names the key's readers and its reporter, as listed under **Depends on**, and says the engine seam is untouched by any of them, keeping the `**[shipped]**` tag style. Its last sentence, *"What remains of the coupling — draft-pull-request output and comment-based park-and-ask — is …"*, becomes: what remains is adapters beyond GitHub, which no numbered roadmap item carries.
- [ ] **`ARCHITECTURE.md` → `## 8.`**: in the `forge` paragraph, the sentence beginning *"Before the issue trigger landed, what was absent was the observer"* and what follows it state that the trigger supplied a reader and a reporter, and that the coupling's other parts have since landed under the same reporter. The rule paragraph after it is unchanged, since it still holds. In the later paragraph opening "**This declaration has the shape the rule above refuses**", the sentence *"For `forge` that outcome has since been paid for the key's trigger part — its issue trigger is a reader and `doctor`'s `forge` check its reporter — …"* is restated so that the outcome has been paid for the **whole coupling**: the trigger, `control`, `report` and `deliver` are its readers and `doctor`'s `forge` check its reporter; the sentence's `design.source` half is kept as it is. The dated phrases "until its issue trigger landed" in the *Applied to the engine seam* and *`design.source` — the same outcome* paragraphs stay unchanged: they are still true.
- [ ] **`docs/config.md` → the `forge` row**:
  - Keep *"`\"none\"` means no forge integration at all — work stays on branches and no pull request is opened"*.
  - Replace everything from *"`\"github\"`, with `execution.target` `\"github-actions\"`, makes `init` write"* through **Still waiting:** with what `github` turns on — the trigger, comment commands, review rounds, lifecycle comments, state labels and the draft pull request — linking [`github-run-control.md`](github-run-control.md) and [`github-issue-trigger.md`](github-issue-trigger.md). Then: the trigger and the run workflow re-read the key at run time and act on nothing when it no longer says `"github"`; `"gitlab"` writes nothing in this release; `doctor`'s `forge` check reports every state; and `push-branch.sh` still opens no pull request — the run workflow opens it after the run.
  - The row says the coupling is **delivered for GitHub**, and names adapters beyond GitHub as what is not built.
- [ ] Re-run the story index's derivation entry A (`## Scope register`) after the edit, and confirm that none of this task's sites still matches `still to come`, `draft-pull-request output`, `comment-based park` or `trigger part`; the remaining `its issue trigger landed` hits are the register's `no-change` rows.

**Verification:**

- `git grep -n -i "draft-pull-request output\|comment-based park\|comment park-and-ask" -- schemas ARCHITECTURE.md docs/config.md` finds nothing.
- `git grep -n -i "trigger part" -- ARCHITECTURE.md` finds nothing.
- `jq -e '.properties.forge.enum == ["github", "gitlab", "none"]' schemas/harness.config.schema.json` exits 0: the edit left the schema parseable, and the enum untouched.

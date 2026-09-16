### Task 2 — Move the *git only*, jj-shapes and missing-remote caveats into `docs/cli.md` §2 and §7

**Goal:** Make `docs/cli.md` the one place that holds the full measured text of three README caveats. The first is the *git only* bullet under `README.md` → `### The shape of the system`. The other two sit under `### Measured while building that evidence, and not fixed here`: the bullet opening **"A remote is a precondition for a run to *start*"** and the bullet opening **"Both `jj` shapes adopt"**. Merge each into what `docs/cli.md` already says, so the fact is stated once. After this task, Task 6 can cut each README bullet to one or two sentences and a link without losing a fact.

**Where this task stops.** This task edits `docs/cli.md` only. It does **not** touch `README.md`. Task 6 cuts the README bullets and links them to the sections named here, so these section names are the interface:

- *git only* hard gate → `docs/cli.md` → `## 2. \`init\``, the bullet **"Not inside a git repository, and the run was not told to create one."**
- jj shapes, and the jj half of *git only* → `docs/cli.md` → `## 7. \`doctor\``, the bullet **"`jj-repository` is a warning in every state it can report"**
- missing remote → `docs/cli.md` → `## 7. \`doctor\``, the bullet **"`remote` is a failure, and it is the check that can make a freshly wired repository exit non-zero."**

Keep those three bullet lead-ins byte-identical, because Task 6 links to them by section and quotes their lead words.

**Merge, never append a second copy.** Before writing, read each destination bullet sentence by sentence against the README text. A fact the bullet already states stays as the bullet states it, and only what is missing is added. Two examples: the `jj git push` hook measurement and the guard's identical refusal are **already** in the `jj-repository` bullet, and the worktree-script refusal (`exit 2`, naming the remedy) is **already** in the `remote` bullet. Measured facts move verbatim, with their version and their exact output.

### Targets

- `docs/cli.md` — §2's git hard-gate bullet, §2's analyze-step paragraph (the one opening "The second step is the analyze command"), and §7's `jj-repository` and `remote` bullets.

**Work:**

- [ ] **§2, git hard gate.** Add to that bullet the one fact it lacks: git is the only version-control system supported (no SVN, no Mercurial), and a `jj` repository adopts either way, with a pointer to §7's `jj-repository` bullet. Everything else in the README's *git only* bullet about the refusal and its reason is already there, so do not restate it.
- [ ] **§7 `jj-repository`: the jj-shapes measurement.** Add what the bullet lacks from the README's *Both `jj` shapes adopt* bullet and the jj half of *git only*. That means: measured on jj 0.44.0, a non-colocated repository's `.jj/repo/store/git_target` holds `../../../.git` and `.jj/repo/store/git` does not exist, so `probeRepoRoot()` grades it `repository`. Also: older jj kept the store at `.jj/repo/store/git`, which is why the version is part of the claim. `init` on the non-colocated fixture exited 0 (`48 created, 28 ensured`), took the ordinary unborn-`HEAD` first-commit path with no refusal and no warning, and `doctor` then graded `18 pass, 4 warn, 0 fail`, byte-identical to both colocated fixtures. A colocated repository has jj export refs and `HEAD` to git on every command, and a non-colocated one does not, so git sees an unborn `HEAD` and an untracked working copy until something writes to it. Record what the release changed: `cli/src/generators/githooks.ts`'s header bounds the hook's caller-agnostic claim, and this check exists. There is no jj-side hook to install. Every figure was taken on one pair of fixtures on one jj version. Then delete the bullet's *"(`README.md` → `## Scope and limits`)"* citation, because the measurement it pointed at now sits in the bullet itself.
- [ ] **§7 `remote`: the in-place run.** Add what the bullet lacks from the README's remote bullet. When a drop fails at `create-worktree.sh`, the watcher archives it as `failed_<timestamp>_<name>` and notifies, and no session runs. A run started **in place** calls no worktree script. `push-branch.sh` is non-fatal by contract (`docs/watcher.md` §2), so every push fails, every committer returns `pushed: failed`, and the flow still reports the branch done with every commit local. The same non-fatality covers a remote that exists but is unreachable or refuses. The captured `examples/notes-app/` run was started in place with no remote, and its intake says so (`examples/notes-app/sdlc-harness/improvement_observations/feat_note_updated_at.md` → *"Every push in the run failed"*). The run's closing Done summary now carries a branch-delivery line: the commit count and whether those commits reached the remote, re-derived at Phase D. A run ends at a pushed branch only when there is somewhere to push it. First check `docs/watcher.md` §2 and §1 for the archive and notify behaviour: where they already state it, cite them rather than restating.
- [ ] **§2 analyze-step paragraph.** Replace the citation *"(root `README.md`, `### Measured while building that evidence, and not fixed here`)"* with `docs/development.md` §6. The headless measurement is stated there already, and Task 3 completes it. Keep the surrounding sentence unchanged.

**Verification:**

- For every sentence in the three README source bullets (read them from `git show dev:README.md`, so the check does not depend on Tasks 5 and 6), name where its fact now stands in `docs/cli.md`, or in a section it cites. A sentence with no home fails this task.
- `git grep -n -F "README.md" -- docs/cli.md` shows no citation of `## Scope and limits` or `### Measured while building…`.
- The three bullet lead-ins named under *Where this task stops* are unchanged: `git diff -- docs/cli.md` shows no edit inside their bold lead words.
- `grep -n -E "items? [0-9]+" docs/cli.md` reports no number that `git show dev:docs/cli.md` did not already carry.
- Run `grep -n -F` on `docs/cli.md` for each measured figure: `0.44.0`, `48 created, 28 ensured`, `18 pass, 4 warn, 0 fail` and `pushed: failed`. Every hit must sit inside the one bullet that owns that fact. A hit in a second bullet or paragraph is a duplicate statement, and merging it is part of this task.

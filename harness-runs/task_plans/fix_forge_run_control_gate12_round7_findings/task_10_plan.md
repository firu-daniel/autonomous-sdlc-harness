### Task 10 — `docs/remote-execution.md`, `docs/github-issue-trigger.md` and `docs/cli.md` state the repair route and the new `doctor` failure

**Goal:** Bring the three other documents in line with this branch. Each currently states that `harness-control.yml` is re-rendered only by `init --force`, or says what `doctor --check-github` asks. After this branch both statements are incomplete:
- any `init` repairs an unedited 0.6.1 copy;
- `doctor --check-github` fails on a workflow GitHub lists by its path.

The task prompt names `docs/remote-execution.md` among the places an adopter must see the route. The other two are the scope register's rows 1–4, reached by its derivation entries D1 and D7.

**Depends on:**
- **Task 2 and Task 3.** Any `init` at a fixed version — plain, `--upgrade-workflows` or `--force` — replaces a `.github/workflows/harness-control.yml` byte-identical to 0.6.1's copy after a `.bak`. It recognises that copy by its SHA-256 over LF-normalised text, since the CLI carries no YAML parser at run time. It prints the commit-and-push commands, with the repaired path on the `git add` line. It keeps an edited copy that still carries 0.6.1's `if:` line and warns, naming the hand fix (`if: >-`) and `init --force`. The repair's `.bak` is **not** in the managed `.gitignore` block: delete it once compared.
- **Task 4.** `doctor --check-github` reads `gh api repos/{owner}/{repo}/actions/workflows?per_page=100` once, then grades:
  - **fail** — any judged harness workflow GitHub lists with `name` equal to its `path`, naming the file and the route. The judged set is `harness-run.yml` and `harness-resume.yml` always, plus `harness-trigger.yml` and `harness-control.yml` when the trigger applies;
  - **warn** — a listing it cannot read;
  - **no confirmation** — the "GitHub knows `harness-trigger.yml` and `harness-control.yml`" line is no longer printed when either was failed this way.

### Targets

- `docs/remote-execution.md` → `### Upgrading` → the bullet "**It does not re-render `harness-trigger.yml` or `harness-control.yml`.**"
- `docs/github-issue-trigger.md`, in two places:
  - **2. Write the trigger workflow.**, the sentence "Neither carries a version pin, so `init --upgrade-workflows` does not re-render them; `init --force` replaces each after a `.bak`.";
  - **6. Check the setup.**, the sentence beginning "`--check-github` adds whether GitHub knows `harness-trigger.yml` and `harness-control.yml`".
- `docs/cli.md`, in two places:
  - the re-run-contract table row for `.github/workflows/harness-control.yml`;
  - the `remote-execution` and `remote-github` paragraph, from "then it asks `gh auth status`, `gh workflow view` for each workflow …" through its grading sentences.

**Work:**

- [ ] **`docs/remote-execution.md`.** Keep the bullet's existing statements. Add one exception, plus the doctor check:
  - any `init`, this upgrade included, replaces a `harness-control.yml` that is byte for byte the copy 0.6.1 wrote, after a `.bak`, because GitHub cannot parse that copy and runs it for no event. The upgrade's `git add` line then names it;
  - an edited copy is kept, with a warning naming the fix;
  - `doctor --check-github` fails on a workflow GitHub lists by its path.

  Cite `docs/development.md` → Gate 12 → Round 7, finding 1. Every command you add goes in its own fenced block, one per line.
- [ ] **`docs/github-issue-trigger.md`.**
  - **Step 2:** keep "`init --force` replaces each after a `.bak`" and add that any `init` also replaces an unedited 0.6.1 `harness-control.yml`, which GitHub cannot parse.
  - **Step 6:** add that `--check-github` also fails when GitHub lists any harness workflow by its path rather than its name, which is how it lists a file it could not parse. Say that the confirmation naming both forge workflows is then withheld.
- [ ] **`docs/cli.md`, the re-run row.** Rewrite the `harness-control.yml` row's third cell. It stays `create-if-absent`. Copied verbatim with no pin; `init --upgrade-workflows` does not re-render it by pin; `--force`, after a `.bak`, is its upgrade path, as it is the scripts'. The one exception: any `init` replaces a copy byte-identical to 0.6.1's, which GitHub cannot parse, after a `.bak`, and keeps and warns about an edited copy still carrying that release's job `if:`. That `.bak` is left visible rather than ignored, because the repair is one-time. This replaces the sentence "It needs no `.gitignore` line, because no upgrade ever `.bak`s it", which this branch makes untrue.
- [ ] **`docs/cli.md`, the `remote-github` paragraph.** Make four changes:
  1. Name the added read (`gh api repos/{owner}/{repo}/actions/workflows?per_page=100`) among what `remote-github` asks.
  2. Add the new **fail** case, in the fails sentence.
  3. Add a listing it cannot read to the "wherever a call timed out …" warnings.
  4. Add, in the trigger sentences, that the confirmation is withheld for a forge workflow listed by its path.

  Keep every existing grade unchanged.

**Verification:**

- Re-run the scope register's entry D1. Every line it reaches now carries the 0.6.1 exception beside its `--force` or `--upgrade-workflows` statement:

  ```
  git grep -nE "harness-control\.yml.*(--force|upgrade-workflows|create-if-absent|\.bak)|(--force|upgrade-workflows|create-if-absent|\.bak).*harness-control\.yml" -- docs cli/templates plugin README.md ARCHITECTURE.md cli/README.md
  ```
- Run the check below. It finds nothing: the `harness-control.yml` row no longer carries the sentence.

  ```
  git grep -n "harness-control.yml.*no upgrade ever" -- docs/cli.md
  ```

  The `.github/workflows/harness-trigger.yml` row directly above it also says "no upgrade ever `.bak`s it". Leave that row unchanged. It is not a target of this task, the scope register has no row for it, and its statement stays true after this branch, because the repair touches only `harness-control.yml`.
- The `docs/cli.md` paragraph's list of `remote-github`'s fail cases matches `cli/src/doctor/checks.ts` → `REMOTE_GITHUB_CHECK`'s doc comment, as Task 4 left it, clause for clause.
- Read every command added in the three files. Each sits alone in a fenced block.

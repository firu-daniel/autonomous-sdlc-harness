### Task 4 — Describe what gate 11 now depends on in `docs/development.md`, `docs/retrieval-eval.md` and `docs/cli.md`

**Goal:** Make the documents say what the gate now needs and what it does not, the task prompt's third deliverable. It needs this checkout's own build (gate `2a`), the workspace's own install of the retrieval packages (`npm ci`), a complete model cache and the stub variable unset. It does **not** need the machine-wide retrieval runtime, at any version. The documents also say what the gate reports when the install is missing, and why that is `BLOCKED`.

**Depends on:** Task 3, and through it Tasks 1 and 2. This task describes what they built, and restates each fact it quotes so it never has to open their files:
- `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable()` makes three refusals before loading anything, in order: the stub variable `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` set; the model cache incomplete; and `unresolvedRetrievalPeers()` non-empty. The last is exported from `cli/src/retrieval/runtime.ts` (Task 1) and lists the optional retrieval peers this checkout's build cannot resolve from `cli/dist`, with the message *"eval: the retrieval packages cannot be resolved from this checkout's build under cli/dist, so no real-model number can be taken; missing: … Run npm ci at the repository root to install them"* (Task 2). The machine-wide runtime check is gone from all three callers.
- `evals/docs-retrieval/check-floor.mjs` exits `0` when every floor is met, `1` on a shortfall or a drift, `3` (`MODEL_CACHE_ABSENT`) on an incomplete model cache, and `4` (`LOCAL_PEERS_ABSENT`) when the build cannot resolve the retrieval packages. On `4` it prints *"check-floor: the retrieval packages cannot be resolved from this checkout's build under cli/dist, so no figure can be taken; missing: … Run npm ci at the repository root"* (Task 3).
- `scripts/run-gates.sh` grades `3` and `4` both as `BLOCKED`, pushed onto neither passes nor failures and listed with the gates it cannot run. Status 4's line is exactly `BLOCKED 11 docs-retrieval relevance floor — the workspace's retrieval packages are not installed`, and status 3's line is unchanged (Task 3).
- **Why status 4 is `BLOCKED`:** running `npm ci` is provisioning of the checkout, like the model cache, and the gates that need the same install (`2a build`, `4 npm test`) go red on their own where it has not run, so `BLOCKED` cannot turn an uninstalled checkout green. The accepted cost is that an install missing only a package gate 11 alone loads (`@huggingface/transformers`) reports `BLOCKED` rather than `FAIL`, with its reason printed.

**Where this task stops.** It edits prose only. It does not touch `docs/retrieval-eval.md` → `## The regression floor` (floor policy, out of scope, story index `## Scope register` rows 10–12), `evals/docs-retrieval/floor.json`, or any other gate's paragraph. Every other site the register lists is `no-change` for the reason given there.

### Targets

- `docs/development.md` → `## 5. Verifying a change`: the paragraph opening *"**Six of the twelve run unattended, and `scripts/run-gates.sh` is how.**"*, and the paragraph opening *"**Gate 11 — docs-retrieval relevance floor.**"* (register rows 3 and 4).
- `docs/retrieval-eval.md` → `## Preconditions`: the bullet opening *"**The retrieval runtime is installed**"* (register row 7).
- `docs/cli.md`: the bullet opening *"**`cli/test/retrieval-loading.test.mjs`** covers the no-load guarantee"* (register row 1).

**Work:**

- [ ] `docs/development.md` → **Six of the twelve …**: *"it runs unattended **where the retrieval model cache is provisioned**, and where the cache is empty it is printed with the gates the script cannot run"* becomes the two-condition form. It runs unattended where the model cache is provisioned and the workspace's install resolves the retrieval packages, and where either is missing it is printed with the gates the script cannot run. The rest of the paragraph stays as it is.
- [ ] `docs/development.md` → **Gate 11**: add what the gate depends on, as listed above, stating plainly that the machine-wide runtime `init` installs is **not** among them and why. The eval loads `cli/dist` and resolves the peers from the workspace, so a runtime at another version, which is every machine after a version bump until it reinstalls, no longer turns the gate red. Add the second `BLOCKED` case beside the empty-cache sentence, with status 4's reason line quoted exactly and the reason it is `BLOCKED` rather than a failure, including the accepted cost. Put the command that clears it in a fenced block of its own, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*):

  ```
  npm ci
  ```

  Keep the paragraph's closing pointer to `docs/retrieval-eval.md` → `## The regression floor` as it is, and restate no floor policy.
- [ ] `docs/retrieval-eval.md` → `## Preconditions`: replace the third bullet with **the retrieval packages resolve from this checkout's build**. `unresolvedRetrievalPeers()` (`cli/src/retrieval/runtime.ts`) is empty when read from `cli/dist`, which in a clone of this repository is the workspace's own `npm ci`, because the optional peers are repeated under `devDependencies`. The refusal names every missing package and the command. Say in one sentence that the machine-wide runtime `init` installs (`docs/retrieval.md` → the **Setup** paragraph) is not a precondition: every pass (`run.mjs`, the cold build, the query-log pass, whose server is `docs serve` spawned from this checkout's `cli/dist/cli.js`) loads this checkout's build. The lead sentence *"Three, each a state rather than a step, and each checked by `evals/docs-retrieval/index-build.mjs` before anything is loaded"* stays true and stays.
- [ ] `docs/cli.md` → the `retrieval-loading.test.mjs` bullet: after *"and the runtime-installed predicate against a planted cache"*, add the fifth case: the unresolved-peers predicate, which lists every peer under a resolve hook that refuses them and none without it.

**Verification:**

- Derivation entry A of the story index's `## Scope register`, re-run verbatim, prints no line without a register row. Every `change` row (1, 3, 4 and 7) now reads true against the facts restated above, and `git diff` changes no line a `no-change` row names. `git diff --stat` lists only `docs/development.md`, `docs/retrieval-eval.md` and `docs/cli.md`.
- `git grep -nF 'The retrieval runtime is installed' -- docs` prints nothing, and `git grep -nF 'retrievalRuntimeState' -- docs/retrieval-eval.md docs/development.md` prints nothing.
- `git diff docs/retrieval-eval.md` shows no line inside `## The regression floor` changed.
- Status 4's reason line as quoted in `docs/development.md` is byte-identical to the one in `scripts/run-gates.sh`: `grep -F "the workspace's retrieval packages are not installed" scripts/run-gates.sh docs/development.md` hits both files.
- **No machine path entered a changed document:** `grep -nE '/(Users|home)/[a-z]' docs/retrieval-eval.md docs/cli.md` prints nothing. For `docs/development.md`, `git grep -cE '/(Users|home)/[a-z]' HEAD -- docs/development.md` before the edit and the same count on the working tree after it are equal, because gate 6's own paragraph quotes a fictional example.

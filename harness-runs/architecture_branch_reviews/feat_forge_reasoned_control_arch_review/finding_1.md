### 1. Read the mention session's model from `agentModel`, not a frozen `MENTION_MODEL='sonnet'`

**Severity:** Must Fix. **Layer:** cli.

**Sites:**
- `cli/templates/scripts/remote-run.sh`: the constant block, at `MENTION_MODEL='sonnet'` and the comment above it, *"The mention session's model (a command declares no `model:`), and its spend bound"*.
- `cli/templates/scripts/remote-run.sh` → `control_mention_session`: the launch line `--model "$MENTION_MODEL" --max-budget-usd "$MENTION_MAX_BUDGET_USD"`.
- `cli/templates/scripts/remote-run.sh`: the header's MENTION paragraph, which lists `--model "$MENTION_MODEL"` among the session flags.
- `cli/test/remote-control-mention.test.mjs`: the argv assertion `assert.equal(value('--model'), 'sonnet');`.

**Problem.** This branch adds a headless session to an outer-loop script and fixes its model as a literal. But the model a headless run uses already has a home:
- `agentModel` in `harness.config.json`. `docs/config.md` §5 describes it as *"Model identifier the outer loop passes to a headless run — one place to trade run cost against capability"*.
- Its shell reader, `hr_agent_model` in `cli/templates/scripts/lib/harness-run-lib.sh` (*"`agentModel` — what the outer loop passes to a headless run"*). `remote-run.sh` already sources that library and already runs `hr_config_load "$root"` before any verb runs.

So `MENTION_MODEL='sonnet'` is a second home for a responsibility that has one, and it freezes a value that varies between adopters into a shipped script. An adopter who set `agentModel` to a pinned model name, or to a model their account or provider exposes under another identifier, still gets `sonnet` on every mention. Nothing reports this, and no setting can change it.

Rules broken:
- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"`harness.config.json` … is the source of truth for everything that varies between adopters"*, and *"No configured value is ever frozen into a generated file"*.
- `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one."*

The plan's reason, that a command declares no `model:` so the flag alone sets it, explains why a `--model` flag is needed. It does not explain why its value is a literal rather than the configured one. No prompt point or deferral authorises the literal.

**Fix.** Take one of these two routes. Route (a) is the minimal one.

- **(a) Use the configured model.** In `cli/templates/scripts/remote-run.sh`:
  - Delete `MENTION_MODEL='sonnet'` and its comment. Keep `MENTION_MAX_BUDGET_USD` with a comment of its own.
  - In `control_mention` (or `control_mention_session`), resolve the model with `hr_agent_model "$root"`. `$root` is the configuration root the script already resolved for `control`, through `hr_repo_root` and `hr_config_load`. Pass the result as `--model "<that value>"`. If the reader fails, fall back to the schema default the library already carries.
  - Update the header's MENTION paragraph to say the model is `agentModel`'s, read through `hr_agent_model`.
  - In `cli/test/remote-control-mention.test.mjs`, change the `--model` assertion so it expects the fixture's configured `agentModel`. That is the `init` default, `opus`, unless the fixture sets another. Add one case that sets `agentModel` to a distinct value through the fixture's `harness.config.json` and asserts that the argv carries it.
  - In `docs/github-run-control.md`, update any statement of the session's argv that names a fixed model, so it names `agentModel` instead.
- **(b) A deliberately separate, cheaper model for the mention read.** Make it a configuration key, in the contract order `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent` item 1 requires:
  - `schemas/harness.config.schema.json`, then `cli/src/config/model.ts`, then `cli/src/config/check.ts`, then the `docs/config.md` §5 row.
  - A shell reader in `cli/templates/scripts/lib/harness-run-lib.sh` beside `hr_agent_model`, with `remote-run.sh` reading the key through it.
  - The accompanying set `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` lists for a configuration key.

  Do not keep a literal model in the script.

**Deviations from plan:**
- Route (a) taken. Fallback when `hr_agent_model` fails (configuration unreadable): the `--model` flag is omitted so the agent CLI applies its own default, following `autonomous-watcher.sh`'s `model_args` precedent, rather than writing `opus` into `remote-run.sh` — the schema default is only reachable through `hr_agent_model` on a readable configuration, and a literal copy would be a second home for it.
- `docs/github-run-control.md` states no fixed model for the session's argv (`grep -n "sonnet\|--model\|MENTION_MODEL"` returns nothing), so no docs edit was needed; that file is also outside the `cli` path scope.

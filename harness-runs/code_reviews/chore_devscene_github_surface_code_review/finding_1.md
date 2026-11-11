### 1. The handle paragraph still argues the old handle's choice and never says why `@dev-scene` is hyphenated

**File:** `docs/github-run-control.md` (`**The handle.**` paragraph) — "The shorter `@harness` was not used because it belongs to another organisation"

The branch respelled `@sdlc-harness` to `@dev-scene` in this paragraph, but kept its closing sentence, which justifies the *previous* handle by naming the alternative it rejected (`@harness`). Nothing in the tree records why the new handle carries a hyphen while the trigger label (`devscene`), the state-label prefix (`devscene: `) and the hidden marker (`<!-- devscene`) do not. The reason is in the task prompt only: the GitHub account `devscene` belongs to someone else. The task prompt is a run artifact under `harness-runs/`, which `.claude/context/conventions.md` → `## Documents of record` says describes a run, not this project.

Who gets it wrong without the reason: a maintainer or a later rename branch tidying the names to match. Seeing `@dev-scene` beside `devscene` everywhere else, they read the hyphen as a typo and respell `COMMAND_HANDLE` (and its mirrors in `remote-run.sh` and the control workflow's `if:`) to `@devscene`. Every command comment would then mention, and so notify, a stranger's account. `docs/github-run-control.md` is the design of record for comment commands, and this paragraph is where the handle's choice is argued, so the reason belongs here.

**Fix:** replace the paragraph's last sentence, the one quoted above, ending "(`gh api users/harness`, observed by the maintainer on 2026-10-01).", with:

```markdown
The handle is hyphenated, unlike the `devscene` trigger label, state labels and hidden marker, because the GitHub account `devscene` belongs to someone else, so `@devscene` would mention, and notify, that account on every command. An earlier choice of handle passed over the shorter `@harness` for the same reason: it belongs to another organisation (`gh api users/harness`, observed by the maintainer on 2026-10-01).
```

Leave every other sentence of the paragraph as it is. This fix edits no test file. The unit loop runs any tree guard whose `treeGuards` glob covers `docs/github-run-control.md`, and the full suite runs in the Run gates phase.

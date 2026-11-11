### Task 19 — Retitle and relink `llms.txt` and move its gate to the new title and URL

**Goal:** `llms.txt` is titled `# DevScene`, every link targets `https://github.com/firu-daniel/devscene/…`, and every command it quotes is `devscene`. Gate 6c (`scripts/check-llms-txt.sh`) enforces the new title and the new link prefixes. Apply the spelling table in the story index's `## Context`.

**Depends on:** Tasks 11 and 14, which renamed the plugin and marketplace to `devscene`. So the install lines this file quotes are `claude plugin marketplace add firu-daniel/devscene` and `claude plugin install devscene@devscene`, and the command prefix it describes is `devscene:`.

**Cross-file contract.** The gate and the file it grades change together in this task, so gate 6c passes on this commit. `docs/development.md` §5 gate 6 states the same contract in prose: the first line exactly `# DevScene`, and link targets under `https://github.com/firu-daniel/devscene/blob/main/` and `/tree/main/`. That prose is Task 22's and must quote these two values byte for byte.

### Targets

- `llms.txt`
- `scripts/check-llms-txt.sh`

**Work:**

- [ ] `llms.txt`: line 1 becomes `# DevScene`. The `> ` summary line names the product `DevScene` and keeps the category noun: *"DevScene is an autonomous software-delivery harness for Claude Code: …"*, with the rest of the sentence kept.
- [ ] `llms.txt`: every link target's `firu-daniel/autonomous-sdlc-harness` becomes `firu-daniel/devscene`, with the path after it unchanged. Every `/autonomous-sdlc-harness:<command>` and the sentence on the `autonomous-sdlc-harness:` prefix become `/devscene:<command>` and the `devscene:` prefix. The install lines become `claude plugin marketplace add firu-daniel/devscene` and `claude plugin install devscene@devscene`. Every `npx autonomous-sdlc-harness …` becomes `npx devscene …`. Each command stays alone on its line in its fenced block (lessons ledger → *Adopter-facing documentation*).
- [ ] `check-llms-txt.sh`: the header contract lines 1 and 3, `blob_prefix="https://github.com/firu-daniel/devscene/blob/main/"`, `tree_prefix="https://github.com/firu-daniel/devscene/tree/main/"`, and the first-line check `[ "$first_line" != "# DevScene" ]` together with its finding text `must be exactly '# DevScene'`.
- [ ] Parse the edited script with `bash -n scripts/check-llms-txt.sh`. Gate 6c itself runs in the Run gates round.

**Verification:**

- `git grep -n -o -E '\]\([^)]*\)' -- llms.txt` lists only targets that start `https://github.com/firu-daniel/devscene/blob/main/` or `https://github.com/firu-daniel/devscene/tree/main/`, each with the same path after the prefix as at `HEAD`.
- `git grep -n -F 'autonomous-sdlc-harness' -- llms.txt scripts/check-llms-txt.sh` prints nothing.
- `head -n 1 llms.txt` prints `# DevScene`.

### Task 20 — Retitle and respell `README.md`, `ARCHITECTURE.md` and `ROADMAP.md`

**Goal:** The three root prose documents present the product as DevScene: the README titled `# DevScene`, its install and quick-start commands on `devscene`, every plugin command `/devscene:<command>`, every URL on `firu-daniel/devscene`, and the architecture table naming the plugin and marketplace `devscene`. Apply the spelling table in the story index's `## Context`.

**Depends on:** Tasks 11 and 14, which renamed the plugin and the marketplace. Also Task 19, whose `llms.txt` quotes the same quick start. The two install lines must read identically in both files: `claude plugin marketplace add firu-daniel/devscene` and `claude plugin install devscene@devscene`.

**Where this task stops.** Prose keeps the category noun: the README's opening describes "DevScene, an autonomous SDLC harness for Claude Code". Headings that other files cite keep their text. The only heading this task changes is the README's H1, and `git grep -n -F '](README.md#'` plus a grep for the old H1 text across the tree must show no citer of it. If one exists, it is respelled in this task only when it is one of these three files. Otherwise it is recorded in this task's return as a stranded citer.

### Targets

- `README.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`

**Work:**

- [ ] `README.md`: title `# DevScene`, and the opening sentence naming the product `DevScene` with "harness" kept as its category noun.
- [ ] `README.md`: both install blocks become `claude plugin marketplace add firu-daniel/devscene` and `claude plugin install devscene@devscene`. Every `npx autonomous-sdlc-harness …` becomes `npx devscene …`, every `/autonomous-sdlc-harness:<command>` becomes `/devscene:<command>`, and both repository URLs become `firu-daniel/devscene`. Each command stays alone on its line in its fenced block (lessons ledger → *Adopter-facing documentation*).
- [ ] `ARCHITECTURE.md` → the manifest row: *"the plugin name `devscene` and the marketplace name `devscene`"*, with the rest of the row kept, including its explanation of why the two names are equal.
- [ ] `ROADMAP.md`: `/devscene:branch-prompt`, `/devscene:harness-analyze` and the cache path `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval/`.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- README.md ARCHITECTURE.md ROADMAP.md` prints nothing.
- `git grep -n -F 'claude plugin install devscene@devscene' -- README.md llms.txt` shows the same line in both files.
- `head -n 1 README.md` prints `# DevScene`.

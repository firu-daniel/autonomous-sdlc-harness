# notes-app/

Read this before running anything here or copying anything out: it carries the decisions this
directory's files do not state themselves, and the properties of it that look like defects and are
not. `docs/development.md` §5 gate 9 leg (iii) reads the keep rule's exception set below as the list
of record, so what that section names is what the leg holds this tree to.

**What this is.** A minimal TypeScript single-page notes application — a `localStorage` gateway, a
domain layer over it, a DOM surface over that — which the harness was adopted into, together with
the artifacts of one **real** end-to-end run over it under `sdlc-harness/`. That run is the branch
`feat_note_updated_at`, which made a note record when it was last edited and put that on its row
across all three layers, and it completed every phase this project's configuration turns on:
`phases.qa` is true, so the capture carries seven interactive tests driven against the live page;
`phases.parity` and `phases.docs` are false, so it exercises neither. The project exists so that
`commands.typecheck` and `commands.test` have something real to bite on, so the interactive-test
phase has a browser surface to drive, and so a first reader can see what the pipeline produces
without running anything. It has **no auth, no network, no backend and no credentials**: a fixture
that needs a login is a fixture nobody can run.

**A snapshot, not a live adoption.** `init`, `doctor` and every wrapper under `scripts/` derive the
repository root from git — the wrappers with `git -C "$script_dir" rev-parse --show-toplevel`
followed by a `cd`, `init` and `doctor` through the same command (`cli/src/core/git.ts`) — and this
directory carries no `.git` of its own, so all of them resolve to the repository that **contains**
it rather than to it. `node cli/dist/cli.js doctor --cwd examples/notes-app` is therefore not a
thing to run here, and neither is `bash scripts/typecheck.sh`: it `cd`s out of this directory and
runs `npm run typecheck` at the enclosing repository's root, which declares no such script. The
wrappers are shipped to **show what `init` generates**. To actually check this project, run the
lines they wrap — `npm ci`, then `npm run typecheck`, `npm test`, `npm run build`, `npm run dev` —
from this directory; to exercise the wrappers themselves, copy the directory into a `git init`-ed
scratch tree and run them there. Every leg of the capture happened in exactly such a scratch
repository outside this checkout, on the precedent `docs/development.md` §5 gates 7–9 set.

**The capture is frozen; the fixture is live.** Everything here that records the harness's *output*
— the run artifacts under `sdlc-harness/`, and the prose of the five documents under
`.claude/context/` and of `.claude/CLAUDE.md` — is a record of what the harness produced on
**2026-09-07**. **No rule introduced after that date grades it.** It is never edited to satisfy one,
and a failure measured against it is evidence of what the harness used to do, never evidence that
the new rule is wrong. `docs/development.md` §5 states the same exemption once, from the same date,
so that a criterion added later inherits it instead of having to remember it.

What stays current is this project's own tree and the **presence** of what `init` wrote: `src/`,
`test/`, `tools/`, the toolchain manifests, `harness.config.json`, `scripts/`, `githooks/`, and the
file set the keep rule below selects — which is what gate 9's four legs hold it to. A change that
adds or alters a token-carrying `cli/templates/` file still owes this directory the rendered
artifact. A change to conventions-document **rules** owes it nothing. Where the two halves disagree,
gate 9 leg (iv) already names the side that moves: the fixture.

**What was kept and what was omitted.** `init` writes more into an adopter's tree than what is
here, and one rule in three clauses decided the difference. A generated artifact with **no
`cli/templates/` counterpart** is composed from this project's own configuration and is kept:
`harness.config.json`, `.claude/settings.json`, and every run artifact under `sdlc-harness/`. One
**rendered from a counterpart carrying a `{{…}}` token** is kept, because rendering put this
project's own values into it: `.claude/CLAUDE.md`, the five filled documents under `.claude/context/`
(`conventions.md`, `data-layer.md`, `domain.md`, `presentation.md`, `tests.md` — one per
`layers[]` row, `tests.md` among them because this project's `test/` directory made today's
`layered-clean-arch` detection add that row), `.claude/harness-task-offer.md`,
`.claude/settings.autonomous.json`, `.claude/push-notify.env.example`,
`.claude/qa-accounts.env.example`, `.claude/qa_test_scenarios.md`, the three wrappers under
`scripts/`, `githooks/pre-push`, `.gitattributes` and `.gitignore`. One whose **counterpart carries
no token** is omitted, whether `init` copied it byte for byte or merged it: the outer-loop
scripts with their shared library `scripts/lib/harness-run-lib.sh`, the run-artifact tree's root
README and its per-directory contract READMEs, and the untouched ledger
`sdlc-harness/improvement_suggestions.md`. Each omitted family is written into an adopter's tree
from `cli/templates/` by `autonomous-sdlc-harness init`; a copy of one here would carry nothing of
this project, duplicate a file this repository already ships, and open a drift surface with no
guard.

**The rule has exactly two exceptions, and each is bought by a kept file that points at the missing
one.** *A link buys the first:* the other untouched ledger, `sdlc-harness/lessons.md`, is carried,
because the kept `.claude/CLAUDE.md` — the file the harness advertises as always loaded, and so the
likeliest first open — links it by relative path, and a fixture that renders a 404 there costs more
than one duplicated seed. `diff cli/templates/state-dir/lessons.md sdlc-harness/lessons.md` exits 0
with no output: the run never appended to the ledger, so carrying it restores the capture rather
than editing it. Nothing enforces that identity, so a change to the template is a `diff` against
this copy, and that `diff` is expected to stay empty. *A presupposition buys the second:*
`.mcp.json` — the wiring `init` wrote for that run — is carried, because the kept
`.claude/settings.autonomous.json` beside it starts the servers it declares. `init` gates the two
halves on one condition and writes them in one run, and refuses its own output when the profile
starts a server the wiring does not declare (`cli/src/generators/repoRoot.ts` →
`assertServersMatchProfile`); a fixture carrying the profile half alone would stand in exactly the
state that check exists to prevent, its `enabledMcpjsonServers` naming two servers no file beside it
declares. Nothing enforces this identity either, so a change to the template is a `diff` against
this copy — and here that `diff` is **not** expected to come back empty by bytes while still being
expected to agree: the shipped copy is semantically identical to `cli/templates/repo/mcp.json` —
both servers, both pins (`@playwright/mcp@0.0.75`, `chrome-devtools-mcp@1.1.1`), both `--isolated`,
the same `_comment` — and differs only in that `init`'s merge re-serialises the two `args` arrays
one element per line. What must stay identical is the wiring the profile presupposes, and that is
what the `diff` is read for. `improvement_suggestions.md` stays omitted because nothing in the
capture points at it.

A second consequence of the omission rule shows the same way: because a per-directory README was,
for most of that tree, the only member the run left behind, omitting them omits those directories
outright — the ten that ship under `sdlc-harness/` are the ones the run actually wrote an artifact
into (`branch_statistics/`, `code_reviews/`, `dispatch_additions/`, `flow_progress/`,
`improvement_observations/`, `review_plan_reviews/`, `story_plans/`, `task_plans/`,
`task_prompts/`, `ui_test_plans/`). That is why a citation inside the capture into
`architecture_reviews/`, `architecture_branch_reviews/`, `skeptic_reviews/`, `user_reviews/`,
`scratch/` or `.claude/settings.local.json` resolves to nothing here, and why four negation rules in
`.gitignore` name READMEs that are not in the tree. Those citations are accurate about the tree the
run had; an adopter's own `init` writes the full set. `docs/cli.md` §3's re-run contract table is
the full generated set, and is where to read what the omitted half is.

**The one edit the kept artifacts carry, and where it landed.** The substitution pass ran over the
**whole** copied tree, not over one file, in three clauses applied longest path first: the scratch
repository's root became `/workspace/notes-app`, its parent became `/workspace`, and any surviving
operator home directory and account name would have become `/workspace` and `adopter`. It found one
file to land in — **`.claude/settings.autonomous.json`, and nothing else**. Before the pass,
`grep -rln "/Users/\|/home/" .` over the copied tree returned that path alone; the run's own
artifacts quote no machine path, so clauses (2) and (3) had nothing left to rewrite after clause (1)
and the home-directory and account-name fallbacks never fired. In that file 28 machine-path
occurrences became 0, and it now carries 28 `/workspace`-rooted occurrences across 23 lines: 27
`/workspace/notes-app`, eleven of them the sibling worktree glob `/workspace/notes-app-*`, and one
bare `/workspace`. Every occurrence was substituted, **prose included** — the two `_comment`
sentences that quote the file rules and the sibling-glob relation, every `Read` / `Edit` / `Write`
file rule, every wrapper `Bash` entry, and the state-directory entry under `additionalDirectories` —
and the derived relation `init` wrote is preserved: the work root is the repository root's parent
and the worktree glob is `<work_root>/<project_name>-*`, so `/workspace`, `/workspace/notes-app` and
`/workspace/notes-app-*` stand in exactly the relation `init` rendered. The reason for the
substitution at all is that a machine path is the one thing an artifact in this tree may not carry
(`docs/development.md` §5 gate 6). Two things follow for a reader: those entries are **not** paths
to run anything against, and an adopter gets their own by running `init` in their own repository.
This is the only place the rewrite is recorded, and it is why a rewritten profile is still a capture
— a stated mechanical substitution, not an edit for style.

One residual survives that pass and is **not** a machine path:
`.claude/settings.json`'s `"repo": "firu-daniel/autonomous-sdlc-harness"` is the harness's own
published marketplace slug, written by `init` from this package's own `repository.url`
(`cli/src/generators/projectSettings.ts`), and rewriting it would misname the marketplace an adopter
is told to add. The operator's account name as a standalone token appears nowhere in this tree.

**How the capture was produced, and against what.** `init` was run as
`node <path to this repository>/cli/dist/cli.js init --qa` — `--qa` the only flag — from a
`git init`-ed scratch repository whose directory basename is `notes-app`, with CLI `0.1.0` built
from this repository at commit **`a08302fb2e3cfa1c2642f0857bd6152a59e8c528`**. That is the commit
the whole capture was taken against. `init` put three questions and **every answer was the offered
default**, taken the way a first-time adopter would: the interactive-test driver
(`web-playwright`), the closing offer to run `/harness-analyze` in the repository's first session
(**yes**), and push notifications for unattended runs (**no**, so no endpoint follow-up was put and
no push settings were written). Nothing else was pinned and nothing was answered to make the output
resemble any earlier capture. The phase set in `harness.config.json` is what those answers produced.

**Two things the shipped tree says that read wrong at first glance.** `harness.config.json` carries
`qa.credentialsPath: ".claude/qa-accounts.env"` because `init` writes that key whenever the
interactive-test phase is on, and it was not edited out; the file it names is never created and is
gitignored, so this project ships no accounts and needs none — the committed
`.claude/qa-accounts.env.example` beside it is what a fresh clone would copy from. And
`sdlc-harness/code_reviews/feat_note_updated_at_code_review/finding_2.md` reasons in its
`## Disposition` about `git checkout` / `git rebase` sitting under `ask` "in this run's permission
profile": the captured run was launched from a supervised session with
`claude --dangerously-skip-permissions` and **not** with
`--settings .claude/settings.autonomous.json`, so that sentence is a correct statement about the
profile an unattended run would have selected, not about the one this run had in force. Both are
what the harness and the run wrote, and neither is edited here.

**Its configuration is its own, and `examples/harness.config.json` is not it.** The sibling
`examples/harness.config.json` is a fabricated `acme-shop` configuration: `npm run validate:config`
validates it, `docs/guard-verification.md` copies it verbatim into the guard fixture, and every
document under `schemas/negative/` is derived from it. This project's `harness.config.json` is a
real one, generated by `init` from this tree's actual layout. The two are never interchanged, and
`npm run validate:config:example` is what keeps this one from drifting.

**Four properties this tree has that a reader should not "fix".**

1. **The two error idioms in `src/data/notesStore.ts` are unreconciled** — `readAll` returns `[]`
   where `writeAll` throws — so the project has no single canonical error idiom, and nothing in the
   tree states one. `test/notesStore.test.mjs` pins both halves and turns red if they are
   harmonised. This is the question `docs/development.md` gate 8's declined-finding criterion was
   put to on this capture, and **both** analyze passes answered it the same way. The opening pass
   wrote the divergence as a rule derived from the code — `.claude/context/data-layer.md`, *"A
   malformed read is absorbed and a failed write is raised … A read that throws would make one
   corrupt element cost the user every note"* — with `conventions` 8 findings, 8 applied, 0
   declined; `data` 2/2/0; `domain` 6/6/0; `presentation` 7/7/0; `tests` 4/4/0. The closing merge
   pass reached the same shape, and its `conventions` review's five applied findings included the
   removal of an unsourced intent claim: `conventions` 5/5/0, `data` 2/2/0, `domain` 2/2/0,
   `presentation` 3/3/0, `tests` 3/3/0. Across both passes no
   finding, divergence or corpus item was declined anywhere, so
   `grep -c "Reviewer finding not applied — "` is 0 in all six corpus members and the
   declined-finding path is exercised and satisfied but still vacuous.
2. **This project is outside the harness workspace's `npm run build` and `npm test`.** That
   workspace's root `package.json` declares `workspaces: ["cli"]` and nothing here is a member, so
   a type error in this fixture cannot break the CLI's build. Its own gate is
   `docs/development.md` §5's fixture gate (gate 9).
3. **An edited capture is no longer a capture** — that is the rule everything `init`, the analyze
   command or the run wrote is held to here. It is why the generated `.claude/` documents name the
   analyze command without the `/autonomous-sdlc-harness:` plugin prefix this file writes it with
   — this README is this tree's prose *about* the capture rather than part of it, so it spells the
   command qualified wherever it names the one this tree runs, and carries one bare occurrence
   above where it quotes the offer `init` put to the operator; `docs/development.md` §6 counts that
   occurrence and puts this file inside the prefix sweep for it — and why that same sweep carves
   out the captured files in this directory. The rule has **exactly one exception**, the
   machine-path substitution disclosed above, whose whole extent is one file. No other captured
   file was touched: `diff -rq` between this directory and the scratch repository it was copied
   from reports that one content difference and otherwise only `Only in` lines — one per omitted
   member, plus this README, which the capture never had. An undisclosed edit is the one that costs
   a reader the capture, so this list is the whole of it.
4. **The capture's shape is `init → analyze → run → analyze`.** The closing
   `/autonomous-sdlc-harness:harness-analyze` pass ran after the branch landed and merged the whole
   corpus against the shipped code — seven targets, six documents, every one classified `merge` and
   none skipped, the mirror image of the opening pass where every one was `write`. It is why the
   conventions documents here describe the project **as it stands beside them** rather than one
   branch behind: `.claude/context/domain.md` names `updatedAt` beside `createdAt` and `pinned` in
   its entity/record naming rule and `UPDATED_AT_WHEN_ABSENT` beside `PINNED_WHEN_ABSENT`;
   `.claude/context/data-layer.md` and `.claude/context/conventions.md` carry the field in their
   serialized-field rules and the widened guard clause; `.claude/context/presentation.md` names the
   `never-edited` / `edited` status pair. Nothing was hand-patched to make that true, and one class
   was left uncorrected because there was nothing to correct: that document records the
   `data-qa-id` vocabulary as unstated in its `## Not determined` section, so it enumerates no
   closed set that the branch could have staled. `.claude/CLAUDE.md` gained the root-static-asset
   constraint and a `Root static asset` row, and `harness.config.json`'s `detection.review` verdict
   was re-recorded as `considered-no-change`. Read the corpus as current for this branch; read
   `## Not determined` in each document as the open questions the pair genuinely could not settle
   from the tree.

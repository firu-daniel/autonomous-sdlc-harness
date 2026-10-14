### Task 10 — Thin `committer`'s `## Commit-message policy`, keeping every wire template

**Goal:** Cut `committer`'s `## Commit-message policy` — its intro and its five bullets, **Subject reconciliation** with its five sub-paragraphs above all — to direct rules stated once, keeping every subject template, the parsed record substring and its separator, and every normalisation rule.

**Depends on:** Task 9 (same file).

**Where this task stops.** It owns all of `## Commit-message policy` in `plugin/agents/committer.md`, from its heading to the line before `## Process`, and nothing else. The heading stays byte-for-byte: `plugin/instructions/improvement_observations_instructions.md` → `## Dispositioned units` cites `committer.md` → `## Commit-message policy`, and `.claude/context/conventions.md` cites the **Fixed-form subjects** bullet by name.

**Wire this task keeps byte-for-byte:**

- the bullet labels **Free-form subject**, **Fixed-form subjects**, **Wrapper-safe subjects**, **Attribution trailer**, **Subject reconciliation** (step 4 and `## Output contract` cite them by name);
- the fixed subjects `chore: add code review for <branch>` and `chore: Mark UI test K passing for <branch>` — with `K`, which `.claude/context/conventions.md` records as this file's spelling;
- the free-form shapes `<commit_prefix>: <short description of the task or fix>` and the description alone when `commit_prefix` is `none`;
- the reconciliation templates `<commit_prefix>: record disposition of <unit token> — <cause>`, `<commit_prefix>: mark <unit token> done — <what the staged set shows>`, `<commit_prefix>: mark <unit token> already passing — <cause>`, their `commit_prefix: none` renderings, and the body-line form `record disposition of <unit token> — <cause>`;
- the substring `record disposition of ` and its ` — ` separator, which `improvement_observations_instructions.md` parses (leading word `record` case-insensitive, every later byte exact);
- `staged: index-only`;
- the unit tokens `Task K` / `Finding K`.

### Targets

- `plugin/agents/committer.md` → `## Commit-message policy`.

**Work:**

- [ ] **Intro, free-form and fixed-form.** Intro: the subject **text** — prefix vocabulary, capitalisation, length cap, fixed-form subjects, trailers — is `<commit_conventions>`'s, applied as written; which shape a commit takes is this file's. Free-form (`task` / `review_item`): the shapes above, formatted per `<commit_conventions>`, the unit's title without its `Task N — ` / `Finding N — ` prefix as the description when reconciliation leaves it standing. Fixed-form: `review_plan_file` and `ui_test_pass` each emit their one exact string, `<branch>` and `K` substituted verbatim, and no caller may ask for another; other commit points emit their own fixed subjects, which the policy enumerates. Drop the maintainer note about editing the dispatching flows when an adopter changes a fixed string.
- [ ] **Wrapper-safe subjects and the attribution trailer.** Keep: every message argument is a shell argument and may carry none of `$(…)`, a backtick, `|`, `>`, `<`, or a braced expansion other than a bare `${IDENT}`; a `>` in a message is refused whole even though the guard admits a descriptor duplication and `/dev/null` in a command; the wrapper validates and rewrites nothing (keep the pointer to `<scripts_dir>/commit-on-branch.sh`'s **MESSAGE ARGUMENTS** header); clause **(a)** normalise, never paraphrase — strip the marks and keep every word (backticks off an identifier, angle brackets off a placeholder, a `$` dropped and its token spelled as a word); clause **(b)** when the title cannot stay recognisable or exceeds the length cap, the subject carries the entry's unit token — every subject matches its entry's title verbatim or names its identifier; the two refused routes (escaping the mark, routing the message through a file or stdin); fixed-form subjects need no normalising; a body line, a cause from another agent's return, and a staged-set description you compose are normalised the same way. Drop the `docs/guard-verification.md` §3.1 citation (`N103`–`N105`) and the "look reasonable at the point of failure" framing. Attribution: add a trailer only if `<commit_conventions>` requires one, never on your own initiative; the wrapper builds the message from the positional arguments after `--`. Drop "The harness takes no position … one project's stance on every adopter."
- [ ] **Subject reconciliation — the test and its two outcomes.** Keep: build the subject after step 3's stage set exists; the test — does the staged set hold any path other than `plan_path`, the unit's own detail file and `unit_findings_folder` (when passed)?; **Yes** → the free-form subject; **No** → `mark … done — ` without `disposition`, `record disposition of … — ` with it, `mark … already passing — ` with `already_passing`, each with its `none` rendering; `<unit token>` is the `Task K` / `Finding K` step 2 resolved; the same **No** also emits the return's `staged: index-only` line. Drop the sentence explaining why the findings folder is excluded.
- [ ] **Subject reconciliation — the records.** Keep: a `disposition` whose unit also landed files puts `record disposition of <unit token> — <cause>` on a body line — the substring on the commit in the subject or a body line, never both, never neither; both templates are free-form, not fixed-form, and take the policy's capitalisation; `record disposition of ` and ` — ` are a parsed interface — the downstream read matches `record` case-insensitively and every byte after it exactly, parses the unit token up to the first ` — ` and the cause as the rest of the line, also when the subject begins with it (`commit_prefix: none`) — so never re-word or re-punctuate it and never put two occurrences on one commit; normalise `<cause>` before passing it; `already_passing` takes the same placement with its own template and its record never contains `record disposition of `; `review_plan_file` and `ui_test_pass` never reach this rule. Drop the worked justifications ("So a unit with one dispositioned layer…", "This is not hypothetical…", "they are spelled here in one case only to show their shape").
- [ ] **Rule inventory check before saving.** Read old and new side by side: every template, rule and exclusion above has a home in the new text, and no wire string was reworded. Restore anything missing in its shortest form.

**Verification:**

- Each wire string above still has a hit — run `git grep -n -F -e '<string>' -- plugin/agents/committer.md` for each and see it print a line.
- The parser's side still matches: `git grep -n -F -e 'record disposition of ' -- plugin/agents/committer.md plugin/instructions/improvement_observations_instructions.md` prints a line in each of the two files.
- The fixed subjects match their quoting files: `git grep -n -F -e 'chore: add code review for <branch>' -- plugin/agents/committer.md plugin/instructions/plan_orchestration_instructions_core.md .claude/context/conventions.md` prints a line in each, and `git grep -n -F -e 'chore: Mark UI test K passing for <branch>' -- plugin/agents/committer.md .claude/context/conventions.md` prints a line in each.
- `git diff -- plugin/agents/committer.md` shows hunks only inside `## Commit-message policy`.
- `wc -w plugin/agents/committer.md`, run before the first edit and again after the last, is lower the second time.

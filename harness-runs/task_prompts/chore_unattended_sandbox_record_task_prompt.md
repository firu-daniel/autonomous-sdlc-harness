`chore_unattended_sandbox_record` writes the unattended sandbox's **document of record** in `docs/`, from measured results. It says what the sandbox contains and what it does not, which commands run outside it and why, what each allowed domain still permits, the results per leg, and the residuals, all in one place. It moves the residual list out of `docs/cli.md` §6, so there is one list.

This is the third of four branches (sandbox3a–3d; sandbox3b was split into 3b1–3b3). It starts from a `dev` that carries `feat_unattended_sandbox_measurement` (sandbox3a, the probe and the hand-run gate), `feat_sandbox_probe_linux_legs` (sandbox3b1, the Linux container legs), `feat_sandbox_probe_job_mode` (sandbox3b2, the clone-less mode and the GitHub-hosted runner legs) and `chore_sandbox_gate12_full_run_leg` (sandbox3b3, the full run on the real job), **and on which the gate's legs have been run by hand and recorded in `docs/sandbox-verification.md`**. That includes the GitHub legs, taken on a release that carries sandbox3b1–3b3. If a leg was not run, its row says so, and this document says so too.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Read the merged code and the evidence record before planning. This prompt was written before the measurements existed.

## The two records, and who owns what

- **`docs/sandbox-verification.md`** stays the **evidence record**: one row per check, with its procedure, expected result, observed quote and verdict. This branch adds no rows to it and rewrites none.
- **The document of record**, new, owns the model and the residuals. It cites evidence rows by id and stays no stronger than the row it cites. It is not a second evidence record: it carries no observed quotes, only verdicts with their row ids.
- **`docs/sandbox.md`**, the adopter-facing explainer that `chore_unattended_sandbox_doc` (sandbox10) writes later, will explain and link to this document. Settle the file name now so sandbox10 can find it, and say in this document's opening which of the three owns what.

## The goal

1. **The document of record** holds:
   1. **What the sandbox contains and what it does not.** Bash and its children are inside. The file tools follow the profile's permission rules. Hooks, local MCP servers, plugin monitors, LSP servers, the status line and `apiKeyHelper` run outside, with full access (S → "What runs outside the sandbox", checked 2026-10-24). Subagents share the parent's sandbox.
   2. **Every command that runs outside it, with its reason:** the three wrappers, `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`, each spelled only as the main checkout's copy; the checks each runs, in order; and the watcher family's own git calls. Keep the list as short as the code allows. The wrapper headers and `docs/cli.md` §6 stay the owners of how each check works, and this document links them.
   3. **The domain list** (`sandbox.allowedDomains`, empty by default) and what an entry still permits: the proxy decides on the hostname alone and does not inspect TLS, so a broad entry such as `github.com` is an exfiltration path, domain fronting included. Include the measured answer on the Bash tool's per-call `allowed_domains` parameter (sandbox3a's network leg).
   4. **The measured results table**, one row per gate leg, with date, platform, Claude Code version and the evidence row id. A leg that was not run is *not yet measured*, never inferred from another platform.
   5. **The Linux runner's PID namespace and no-new-privileges results**, under the stable heading sandbox3b2 named. `fix_run_job_credential_exposure` (sandbox4) cites it for its in-job routes, so give the heading a stable spelling and do not rename it.
2. **State the residuals the series leaves open, in the document of record:**
   - a hand edit to the generated profile removes the protection it touches, and `doctor` is what notices, while the watcher's launch check catches only what `run_profile_check` checks;
   - a task that legitimately needs to edit a write-protected file is refused at once under `dontAsk`;
   - the sandbox covers Bash and its children, not the file tools, which the profile's `Edit` rules cover;
   - hooks, local MCP servers and the status line run outside the sandbox;
   - the detached gate run's own residuals (`cli/templates/scripts/run-test-suite.sh` → `RESIDUALS OF THE DETACHED SHAPE`), linked rather than restated;
   - **every numbered residual in `docs/cli.md` §6** (`**Residuals, stated rather than hidden:**`, items 1–11 as they stand on that `dev`, and residual 1's sub-items). Move them into the document of record and leave `docs/cli.md` pointing at the list, so there is one list. Update every citation of a residual by number, found with a search you record, such as `docs/cli.md §6, residual 2`, `residual 1, item 3` and `residual 11`. Renumber only if the move forces it, and then fix every citation.
   - Where a measurement closed or narrowed a residual (for example residual 2, glob `denyWrite` on Linux, or residual 1 item 3, a clone's `.git/config` on Linux), state what is left and cite the row.
3. **Point at it.** `docs/cli.md` §6 keeps what belongs to the CLI and links the document for the residuals and the measured model. Register the document in `README.md` → `## Where to read more` and in `llms.txt`, in their existing style.

## Constraints

- **No measured result is invented.** Every result this document states cites an evidence row and is no stronger than that row's verdict.
- **Documentation only.** A mismatch between code and docs, or between the records, becomes a follow-up task prompt or a roadmap row, named in the document. It is not fixed here.
- A deferral cites a numbered roadmap item that has a row in `docs/development.md` → `## 6. The roadmap this tree defers to` (`.claude/context/conventions.md` → `## Documents of record`).
- No line-number anchors.
- `scripts/run-gates.sh` passes.

### 1. The evidence copy-out names one evidence directory, but each `refusal` run makes its own, so the refusal sessions' kept evidence is still lost with `--rm`

**File:** `docs/development.md` → `## 5. Verifying a change` → Gate 15, *Copy the evidence out before leaving the container.* — "docker cp sbx-probe-linux:/tmp/sandbox-probe-evidence.<suffix> <host dir>", and the sentence after the block, "`<suffix>` is read off the evidence directory the probe prints as its last stderr line, which the run log holds"

**Problem.** The copy-out block copies exactly one evidence directory, and tells the maintainer to read its `<suffix>` from the run log (`~/sandbox-probe-run.log`). However, every probe process that reaches teardown makes its own evidence directory. On this container the recipe runs that teardown more than once:

- `scripts/sandbox-probe.sh` → the `refusal)` case calls `sp_setup`, the leg and `sp_teardown`. `sp_teardown` first calls `sp__td_keep_evidence` (`scripts/lib/sandbox-probe/session.sh`).
- `sp__td_keep_evidence` runs once per process. For each leg that `sp_leg_nonpass` names, it creates a **new** `mktemp -d "${TMPDIR:-/tmp}/sandbox-probe-evidence.XXXXXX"` directory and moves into it the files that `SP__SESSIONS` recorded.
- The refusal leg launches sessions that are recorded there: `scripts/lib/sandbox-probe/legs-refusal.sh` → `sp_session refusal-rf1 …` and `sp_session refusal-rf3 …`. `sp_session` appends its stream, stderr, prompt and debug files to `SP__SESSIONS` (`session.sh`, the `SP__SESSIONS="$SP__SESSIONS${SP_CURRENT_LEG:--}"$'\t'"$SP_STREAM"…` line).
- The recipe runs the `refusal` subcommand twice, once with `bwrap` removed and once with `socat` removed (*The refusal subcommand and the hand rows.*). Each run whose RF rows do not all pass leaves one more `/tmp/sandbox-probe-evidence.<suffix>`. That directory's path is printed into `~/sandbox-probe-refusal.log`, not the run log.

**Runtime symptom.** A maintainer who follows the recipe as written copies only the `run` evidence directory. Then they leave the container, and `--rm` deletes any RF1/RF3 non-pass streams. That is PD22's defect, *the container's `--rm` removes the probe's evidence directory*, reached again for the refusal legs. Yet `docs/sandbox-verification.md` §5 PD22 now records it as fixed: "the evidence directory, `~/.claude/projects` and the run logs are copied out with `docker cp` before the container exits". The committed code review states the opposite as verified ("the single `<suffix>` the copy-out names is the only evidence directory a container run produces"). That check looked at HP1 only and missed the `refusal` subcommand's sessions.

**Fix.** In `docs/development.md`, *Copy the evidence out before leaving the container.*, make two edits.

1. Replace the first line of the fenced block, `docker cp sbx-probe-linux:/tmp/sandbox-probe-evidence.<suffix> <host dir>`, with these two lines:

   ```
   docker exec sbx-probe-linux find /tmp -maxdepth 1 -name 'sandbox-probe-evidence.*'
   docker cp sbx-probe-linux:/tmp/sandbox-probe-evidence.<suffix> <host dir>
   ```

   Leave the other three `docker cp` lines as they are.

2. Replace the sentence that begins "`<suffix>` is read off the evidence directory the probe prints as its last stderr line, which the run log holds;" with the following, and keep the rest of that paragraph unchanged:

   > The first line lists every evidence directory the run left: one per `run` or `refusal` invocation that kept anything, each also printed as that invocation's last stderr line, in the run log or the refusal log. The second line is repeated once per directory listed, `<suffix>` taken from each; `TMPDIR` is unset for `probe` in the container, so every directory is under `/tmp`.

Do not edit `docs/sandbox-verification.md`. PD22's wording, "the evidence directory … copied out", stays true once the recipe copies each directory. No test covers this prose, so the fix runs no test.

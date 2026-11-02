# Review plan meta-review — iteration 1

Iteration 0's Must Fix (Finding 1's undeclared departure from "No clone, no per-run profile") is resolved. `finding_1.md` now takes option (b): it states the departure and why, adds a numbered step with exact replacement text for each site, and extends the footprint. I checked every quoted site in steps 2–11 against the tree and each one resolves.

## Must Fix
1. **Missed check: the branch widens the write-probe refusal set, but the Linux pass evidence still names the old two strings** — refers to "Missed checks" (`harness-runs/lessons.md` → `## Evidence and measurement`). File to change: the index `harness-runs/code_reviews/feat_sandbox_probe_job_mode_code_review.md`, plus a new `finding_6.md` in `harness-runs/code_reviews/feat_sandbox_probe_job_mode_code_review/`.
   The diff widens what the probe accepts as a Linux sandbox refusal:
   - `scripts/lib/sandbox-probe/judge.sh` adds `SP__LINUX_SANDBOX_STRINGS=("Read-only file system" "Permission denied" "Device or resource busy")` and `sp__linux_refusal_line`, and `sp__layer` now classes any of the three as `sandbox`.
   - `scripts/lib/sandbox-probe/legs-protection.sh` → `sp__wp_mv_class` now classes the whole set as `refused`.

   The rows these strings grade go into a document of record. The ledger's measurement lessons apply to exactly that: "Grade a write probe on what reached the disk" and "A measurement script stores and reports every reading in full". `.claude/context/conventions.md` → `## Documents of record` adds that "A measured fact states what was measured, the command and the exact message". The index's Context lists "The judge's PD23 shapes" as reviewed, but gives no finding and no clean-pass rationale for any of this.

   There is a concrete defect the review missed. In `scripts/lib/sandbox-probe/legs-protection.sh` → `sp__wp_judge_row`, the Linux pass arm is unchanged by the diff and still records:

   "$passed target(s): every dd and rename refused by the sandbox (Operation not permitted or Read-only file system), every inode and shasum unchanged, no new name created"

   CS1 and CS2 on Linux can now pass on a `Permission denied` or `Device or resource busy` line. When they do, the recorded evidence names messages the probe did not see. That evidence is what `docs/sandbox-verification.md` rows such as CS2 (Linux) and CS7 (Linux) are transcribed from. The disk half of the lesson holds: the same function checks inode and shasum. So the gap is the evidence text, not the grading.
   **Fix:** Add `harness-runs/code_reviews/feat_sandbox_probe_job_mode_code_review/finding_6.md` (Should Fix severity is appropriate). It should:
   - anchor `scripts/lib/sandbox-probe/legs-protection.sh` (`sp__wp_judge_row`) with the quote "refused by the sandbox (Operation not permitted or Read-only file system)";
   - give the replacement evidence text, either built from `SP__LINUX_SANDBOX_STRINGS` through judge.sh or naming all four strings, so the list cannot drift from the judge again;
   - name any test that asserts the old text. I found none under `cli/test/`; the finding should confirm that.

   Then add a `### 6.` pointer under `## Should Fix` in the index and a readiness entry `N. [ ] **Finding 6** — … _(layer: general)_` in ship order. Also add one Context sentence giving the clean-pass rationale for the rest of the lesson: write-probe rows grade inode and shasum on disk, not the call's exit status.

## Should Fix
1. **Finding 2, step 5: the quoted header text spans a comment line break** — `finding_2.md`. In `scripts/lib/sandbox-probe/session.sh` the sentence "In job mode it first writes job.sh's placeholder manifest." is wrapped as "In job\n#                            mode it first writes job.sh's placeholder manifest.", so a literal grep for the quote finds nothing. Quote it with the `\n#` break the way `finding_1.md` does, or anchor on "mode it first writes job.sh's placeholder manifest".
2. **Finding 3's new `if` chain loses a pass it had before** — `finding_3.md`. Take `sysctl` other than `1` with both readings `present without userns`, for example a runner whose profile carries no `userns,` line and whose sysctl reads `0`. Today that reads `present`/`present` and passes as "not needed". Under the new chain it falls through to `not run`. Add an arm, or widen the `present`/`present` "not needed" arm so it also matches `present without userns` on both sides when the sysctl is not `1`. Add the matching `graded` case in `cli/test/sandbox-probe-runner-legs.test.mjs`.

### Task 2 — Judge the denied-directory text before `permission_denials`, and grade N5's `allowed_domains cannot widen` refusal as a pass

**Goal:** Fix two judge defects in `scripts/lib/sandbox-probe/judge.sh` (PD2 and PD4 in `docs/sandbox-verification.md` §5).

- **W6.** `sp__layer` filed every file-tool refusal under the permission layer, because Claude Code 2.1.311 also lists those refusals in the `result` event's `permission_denials`.
- **N5.** `sp_judge_allowed_domains` graded the Bash tool's own refusal of the `allowed_domains` parameter as `not run`.

**Where this task stops.** It changes no leg and no fixture. Task 10 adds the two recorded-stream fixtures and the cases that drive both fixes through `scripts/sandbox-probe.sh judge`. W6's and N5's rows in `docs/sandbox-verification.md` are not edited: W6's call and expected are unchanged, and Task 16 amends N5's expected column.

### Targets

- `scripts/lib/sandbox-probe/judge.sh`: `sp__layer`, `sp_judge_allowed_domains` and the header's layer table.

**Work:**

- [ ] **`sp__layer` precedence.**
  - Test the text `File is in a directory that is denied by your permission settings.` **before** the `permission_denials` lookup. The permission-text test (`Permission to use ` … `has been denied`) stays first.
  - A call whose result carries the denied-directory text is layer `file-tool`, with the same evidence line as today, whether or not it is also listed in `permission_denials`.
  - The resulting order:
    1. permission text;
    2. file-tool text;
    3. `permission_denials`;
    4. network;
    5. sandbox;
    6. ran.
  - `cli/test/fixtures/sandbox-probe/permission-precedence.jsonl` (permission text plus `Operation not permitted`) and `permission-denials.jsonl` (a denial with neither text) must still read `permission`.
- [ ] **N5's `cannot widen` refusal.**
  - In `sp_judge_allowed_domains`, after the "no tool_result" arm and before `sp_layer_of`, grade `pass` when the result text carries the stable prefix `allowed_domains cannot widen network access`. The evidence is the first line carrying it, taken with `sp__line_with`.
  - Hold the prefix in one variable at the top of the file (`SP_N5_CANNOT_WIDEN="allowed_domains cannot widen network access"`), so the string has one owner.
  - The existing arms are unchanged:
    - no `allowed_domains` parameter → `not run`;
    - any refusal layer → `pass`;
    - an error with no refusal string → `not run`. This includes `n5-tool-error.jsonl`'s *"allowed_domains applies only to a command that runs in the sandbox…"*, which is the skeptic's unknown case and must stay `not run`.
    - layer `ran` on a non-error result → `fail` with the finding.
- [ ] **The header.**
  - Rewrite the header's layer table in the new order. Say in one clause why file-tool precedes `permission_denials` (2.1.311 lists file-tool refusals there).
  - Name the `cannot widen` prefix in the comment above `sp_judge_allowed_domains`, as arm 2's second form.

**Verification:**

- `bash scripts/sandbox-probe.sh judge call cli/test/fixtures/sandbox-probe/permission-denials.jsonl permission 'rm -rf @FIXTURE_ROOT@/outside'` still prints `result="pass"` with evidence `This command requires approval (in permission_denials)`.
- `bash scripts/sandbox-probe.sh judge allowed-domains cli/test/fixtures/sandbox-probe/n5-tool-error.jsonl 'curl -sS -o /dev/null https://n5.example.invalid/'` still prints `result="not run"`.
- The literal `allowed_domains cannot widen network access` appears once in `judge.sh` outside comments: `grep -n 'cannot widen' scripts/lib/sandbox-probe/judge.sh`.

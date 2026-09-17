### Task 6 — State-dir READMEs: one question file per park, and the consumed-set archive

**Goal:** Make the two committed READMEs `init` writes into an adopter's run-artifact tree describe the channel as it now works: one question file per park holding every question that park raises, one answer file per park, a resume only once every open question file is answered, and an archive of exactly the pairs that resume consumed — and make the digest README say one block per park.

**Depends on:** Task 1, whose watcher behaviour the first README describes from the adopter's side. The channel's canonical definition is Task 7's (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format`); these READMEs are an adopter-facing summary of it and must agree with it on each point below:

- `question_<n>.md` is one **park**: every question that park raises, each as a `## Q<k> — <decision needed>` section, `k` from 1. `<n>` stays 1-based, unique across the branch directory **and** its `answered/` archive, never reused.
- `answer_<n>.md` answers the whole park; a question is addressed by its `Q<k>` label, and a question the answer leaves unaddressed is asked again by the resumed run in a new park file.
- The watcher resumes only when every top-level question file has its answer, and on exit archives exactly the pairs that resume consumed; a pair that arrives while the resumed run is going stays at the top level for the next resume. A park written before this layout (several one-question files) is resumed and archived by the same rule.
- The digest writes one block per question file — one per park — keyed `question_<n>`; blocks already written for one-question files stay as they are.

### Targets

- `cli/templates/state-dir/clarifications/README.md`
- `cli/templates/state-dir/clarification_digests/README.md`

**Work:**

- [ ] `clarifications/README.md` first paragraph: replace "one question per file" with the park unit — one `question_<n>.md` per park holding every question as `## Q<k>` sections, one `answer_<n>.md` per park — keeping the index rule and its "never reused" reasons word for word where they still hold.
- [ ] Second and third paragraphs: replace "re-launches the same engine … for the lowest answered index" with the resume rule (every open question file answered) and the archive rule (exactly the pairs that resume consumed; a pair written during the resumed run stays). Add one sentence on answering part of a park: address a question by its `Q<k>` label, and whatever is left unaddressed comes back as a new park. Change "one committed block per question" to one block per park.
- [ ] `clarification_digests/README.md`: "one block per clarification" becomes one block per park (question file), keyed by its `question_<n>` index, and one sentence that blocks written before this layout — one per question — are left exactly as written and still uniquely keyed.

**Verification:**

- `grep -n "one question per file\|lowest answered index\|block per question" cli/templates/state-dir/clarifications/README.md cli/templates/state-dir/clarification_digests/README.md` prints nothing.
- Each of the four bullets under `**Depends on:**` is stated in one of the two files, in words that do not contradict Task 7's section.
- `bash scripts/test.sh` exits 0 — `init` writes these templates, and the suite compares what it writes.

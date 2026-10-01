### Task 30 — Open `README.md` and `llms.txt` with both entry points

**Goal:** The root README introduces the harness through its two entry points (goal 9, acceptance 10):

- **local** — the plugin and CLI install;
- **remote, through GitHub** — label an issue, steer the run with comments and reviews.

It says the one-time local setup comes first. The local steps A–F are unchanged, and are followed by a very short section on starting a run and a user-review round from GitHub that links to the adopter-docs section. Nothing may read the dropped `feat_github_native_adoption` as *"every team member needs a local install"*. Nothing may say the team moves to GitHub after the setup: every team member can keep a local setup and work runs from GitHub at the same time. `llms.txt`, which mirrors the README's opening for a language model, says the same and lists the new document.

**Depends on:** Task 25, which writes `docs/github-run-control.md` → `## The GitHub entry point`, the anchor `#the-github-entry-point`. That section holds the one-time setup list, what a team member with write access does from GitHub alone, what still needs a local machine, and the caveats. Also restated from Tasks 2 and 6: labelling an issue `sdlc-harness` starts a run, a review requesting changes on a pull request from the run's branch starts a user-review round, and a completed run on GitHub opens a draft pull request. With `forge` `github` and `execution.target` `github-actions`, a team member who uses only the GitHub route needs nothing local: no clone, no plugin and no `init`.

**Where this task stops.** The README restates nothing the entry-point section owns. It links there. `### Adopting it in your own repository`'s steps A–F, and their fenced commands, are untouched (goal 9). `ROADMAP.md` is Task 31's.

### Targets

- `README.md` — the opening lines before the five-step checklist, a new `### Working from GitHub` section after step F, `### The shape of the system`'s *Forge-agnostic* bullet, and `## Where to read more`.
- `llms.txt` — the `> ` summary line and the documentation list.

**Work:**

- [ ] **The opening**: keep *"An autonomous software-delivery harness for Claude Code."* and, verbatim, *"You ask for a change, and you get back a branch that has been planned, implemented and independently reviewed, pushed and ready for your review."* Then add two short sentences before *"You install two things"*:
  - the harness has two entry points used together — locally, through the plugin and CLI installed below, and from GitHub, where labelling an issue starts a run and comments and reviews steer it to a draft pull request;
  - the GitHub route works once one maintainer has done a one-time local setup.

  The five-step checklist that follows is the local entry point and stays as it is.
- [ ] **`### Working from GitHub`**, a new section directly after step F's closing paragraph and before `## How it is measured`, of at most two short paragraphs:
  - once the setup is done, labelling an issue `sdlc-harness` starts a run, and a review that requests changes on a pull request from the run's branch starts a user-review round;
  - with `forge` `github` and `execution.target` `github-actions`, a team member who uses only this route needs nothing local — no clone, no plugin and no `init` — and anyone may use both routes at once;
  - one link to [`docs/github-run-control.md`](docs/github-run-control.md#the-github-entry-point) for the setup, the comment commands, what still needs a local machine, and the caveats.

  It holds no command list, because the linked section owns that.
- [ ] **The *Forge-agnostic* bullet** under `### The shape of the system` is retitled and restated:
  - with `forge` `github` and runs on GitHub Actions, a labelled issue starts a run, comments and reviews steer it, and a completed run opens a draft pull request;
  - merging stays yours, the flow never merges, and `push-branch.sh` still opens no pull request — the run workflow does ([`docs/github-run-control.md`](docs/github-run-control.md));
  - `gitlab` and `none` write nothing, and `doctor` reports the key.

  Its *"The configuration check speaks only when the key is present and holds none of those three"* stays.
- [ ] **`## Where to read more`**: add `docs/github-run-control.md` beside `docs/github-issue-trigger.md`, in that list's style.
- [ ] **`llms.txt`**:
  - its `> ` summary line keeps its first clause and adds that the harness is used locally and from GitHub, after a one-time local setup;
  - its documentation list gains, after the `docs/github-issue-trigger.md` entry, `- [docs/github-run-control.md](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/github-run-control.md): working a run from GitHub: comment commands, review rounds, the draft pull request, lifecycle comments and state labels, and the GitHub entry point.`;
  - its five-step quick start is unchanged.

  `scripts/check-llms-txt.sh` grades this file's links. They are run at Phase G, not here.

**Verification:**

- `git diff -- README.md` touches no line between `### Adopting it in your own repository` and the end of step F: the local steps are unchanged.
- `git grep -n -i "moves to github\|move to github\|every team member needs\|instead of the local" -- README.md llms.txt` finds nothing.
- `git grep -n "github-run-control.md#the-github-entry-point" -- README.md` finds the new section's link, and the anchor exists: `git grep -n "^## The GitHub entry point$" -- docs/github-run-control.md`.

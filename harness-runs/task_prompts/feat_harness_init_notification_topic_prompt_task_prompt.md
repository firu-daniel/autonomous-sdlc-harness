# Task prompt — make the push-notification setup answerable by a non-technical adopter

Branch: `feat_harness_init_notification_topic_prompt`.

### Run mode

- **Skip the QA / UI-test phase** (`no_ui`). Nothing renders.
- `task-plan-reviewer`, the architecture gate, `branch-reviewer` and `skeptic-reviewer` run normally.

---

## The observation

Setting up push notifications during harness setup asks the adopter for a destination to post to. Read what the
setup run actually puts on screen, in both the interactive and the flag-driven paths, and read what it prints
when the opt-in is taken but the destination is left blank — the wording differs between those paths and the
difference is part of what is being fixed.

An average or non-technical adopter reads that question as *"I have to stand up a server before I can have
notifications"*, and stops. That is the wrong conclusion: there is a route that needs no server and no account —
install the **ntfy** app from the App Store / Play Store, create a topic there, and the notification destination
follows from the topic name alone.

## What to deliver

The setup should offer that easy route **as a suggestion, at the moment the question is asked**, and accept an
answer given in its terms — an adopter who types what the ntfy app gave them should end up correctly configured
without having to know how the destination is assembled.

Binding constraints, and the whole point of the change:

- **It is a suggestion, never the only accepted answer.** A full destination URL for any other service must stay
  equally answerable and equally documented, at the same moment, in the same question. A change that makes ntfy
  the required path is a failed change.
- **Whatever is offered interactively must be answerable non-interactively too.** Establish which non-interactive
  entry points can supply this value and keep them from disagreeing with the prompt; two answers to "what may I
  type here" is the defect being introduced.
- **An answer that is neither** must not silently produce a broken configuration. Decide what happens and make it
  observable to the adopter.
- **What is stored is a credential.** Establish from the existing implementation and docs what that implies for
  echoing, logging and file handling, and do not regress any of it. Whether the ntfy topic name itself carries
  that property is a question to settle in the plan, and the wording the adopter is shown depends on the answer.

## Ripple to establish, not to assume

- Every other place the setup narrates this destination — the blank-answer guidance, the option/flag summaries,
  the machine-local file's own header, the committed example file, and the docs sections that describe delivery
  and its precedence. Find them; leaving one describing the old contract is an incomplete change.
- Existing adopters: an already-configured machine must not be re-pointed, re-written or degraded by a re-run.
  Cover the re-run path with a test, not with an argument.
- The delivery side is shell and already ships. Establish whether it needs to change at all — **"no change there"
  is a legitimate finding**, but state it as one.

## Out of scope

Adding authentication (bearer tokens, protected topics) for any notification service, and adding a second
built-in service. The change is the wording of the question and what the setup accepts as an answer to it.

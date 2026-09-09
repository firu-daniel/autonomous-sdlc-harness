# Presentation layer

> **Read this when:** you are building or reviewing anything a user sees — screens, components, navigation, styling, user-visible copy. **Skip when:** the change sits behind the interface; business rules and wire shapes have their own files.

**Purpose.** What a screen has to do to look and behave like the rest of this project, plus the two review contracts the harness itself checks here.

**What belongs here**

- The styling, spacing and sizing tokens a component uses instead of literal values, and the files that declare them.
- Where user-visible copy comes from, so no string is written inline in a component.
- The shared components a new screen is expected to reuse rather than rebuild.
- The screen lifecycle: what every screen does on entry, and what it must tear down on exit.
- Every place a **new** screen has to be registered — route table, navigation entry, anything else that would otherwise leave it unreachable. List them all; a missed one is the most common way a finished screen ships invisible.

**Two harness contracts, portable to any interface stack**

- **Test attributes.** Every element an interactive test drives carries a stable test attribute, applied through one shared helper rather than hand-written per element, because the test agent locates elements by that attribute and by nothing else. A class name or a copy string is not a substitute: both change for reasons that have nothing to do with the test, and a control with no attribute is simply untestable.
- **Component size.** A review flags a component past this project's size threshold and splits it. Write the numbers down here: they are a review-severity contract, so a reviewer cites a threshold rather than arguing taste.

**One generic example**

```
<ConfirmButton
  label={t('checkout.confirm')}          // copy from the localization source, never inline
  spacing={spacing.md}                   // a token, never a literal
  testAttr={testAttr('checkout-confirm')}  // one helper, one stable hook for the test agent
/>
```

_Run `{{analyzeInvocation}}` to fill this in from this repository's own code, or replace everything above with this project's own presentation rules; either way this file is yours from here on and a re-run of `autonomous-sdlc-harness init` keeps your copy — and if you write it by hand, the marker on the last line goes with it._

<!-- harness:unfilled -->

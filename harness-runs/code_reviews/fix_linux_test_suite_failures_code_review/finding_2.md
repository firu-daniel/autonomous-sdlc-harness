### 2. `docs/cli.md` §10's "The third redirect is not redundant with the second" now names the wrong redirects

**File:** `docs/cli.md` (`## 10. How this is tested`, the bullet beginning "**git runs with every configuration source it reads pointed away**"): "The third redirect is not redundant with the second"

The branch reordered this bullet's list of redirects. It now reads: "the system file redirected to an empty one, the system scope suppressed outright on top of that, and the per-user file redirected to the checked-in `cli/test/helpers/isolated-gitconfig`". By that list, the *third* redirect is the per-user file and the *second* is the system-scope suppression. The sentence that follows, after the inserted identity sentences, still uses the old numbering, under which the third was the suppression and the second the system-file redirect. It reads "The third redirect is not redundant with the second: some git builds ship a **bundled** system configuration that redirecting the system file does not reach…". A reader now matches that claim to the per-user file and the system-scope suppression. The bundled-configuration argument is about neither, so the reader takes away a false reason for why each redirect exists.

**Fix:** name the two redirects instead of counting them. Replace

> The third redirect is not redundant with the second:

with

> Suppressing the system scope is not redundant with redirecting the system file:

Leave the rest of the sentence ("some git builds ship a **bundled** system configuration that redirecting the system file does not reach, …") unchanged.

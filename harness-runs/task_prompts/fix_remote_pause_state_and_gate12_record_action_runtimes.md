# Action runtime record — fix_remote_pause_state_and_gate12_record

Lookups run 2026-09-29T08:21Z (UTC) by a maintainer with `gh auth status` succeeding. Output verbatim; each block headed by its command.

## actions/checkout

### 1. Newest non-prerelease release

### `gh release list --repo actions/checkout --exclude-pre-releases --limit 1`

```
v7.0.1	Latest	v7.0.1	2026-07-20T15:10:05Z
```

### 2. action.yml at v4 through v7

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/checkout/contents/action.yml?ref=v4"`

```
name: 'Checkout'
description: 'Checkout a Git repository at a particular version'
inputs:
  repository:
    description: 'Repository name with owner. For example, actions/checkout'
    default: ${{ github.repository }}
  ref:
    description: >
      The branch, tag or SHA to checkout. When checking out the repository that
      triggered a workflow, this defaults to the reference or SHA for that
      event.  Otherwise, uses the default branch.
  token:
    description: >
      Personal access token (PAT) used to fetch the repository. The PAT is configured
      with the local git config, which enables your scripts to run authenticated git
      commands. The post-job step removes the PAT.


      We recommend using a service account with the least permissions necessary.
      Also when generating a new PAT, select the least scopes necessary.


      [Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
    default: ${{ github.token }}
  ssh-key:
    description: >
      SSH key used to fetch the repository. The SSH key is configured with the local
      git config, which enables your scripts to run authenticated git commands.
      The post-job step removes the SSH key.


      We recommend using a service account with the least permissions necessary.


      [Learn more about creating and using
      encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
  ssh-known-hosts:
    description: >
      Known hosts in addition to the user and global host key database. The public
      SSH keys for a host may be obtained using the utility `ssh-keyscan`. For example,
      `ssh-keyscan github.com`. The public key for github.com is always implicitly added.
  ssh-strict:
    description: >
      Whether to perform strict host key checking. When true, adds the options `StrictHostKeyChecking=yes`
      and `CheckHostIP=no` to the SSH command line. Use the input `ssh-known-hosts` to
      configure additional hosts.
    default: true
  ssh-user:
    description: >
      The user to use when connecting to the remote SSH host. By default 'git' is used.
    default: git
  persist-credentials:
    description: 'Whether to configure the token or SSH key with the local git config'
    default: true
  path:
    description: 'Relative path under $GITHUB_WORKSPACE to place the repository'
  clean:
    description: 'Whether to execute `git clean -ffdx && git reset --hard HEAD` before fetching'
    default: true
  filter:
    description: >
      Partially clone against a given filter.
      Overrides sparse-checkout if set.
    default: null
  sparse-checkout:
    description: >
      Do a sparse checkout on given patterns.
      Each pattern should be separated with new lines.
    default: null
  sparse-checkout-cone-mode:
    description: >
      Specifies whether to use cone-mode when doing a sparse checkout.
    default: true
  fetch-depth:
    description: 'Number of commits to fetch. 0 indicates all history for all branches and tags.'
    default: 1
  fetch-tags:
    description: 'Whether to fetch tags, even if fetch-depth > 0.'
    default: false
  show-progress:
    description: 'Whether to show progress status output when fetching.'
    default: true
  lfs:
    description: 'Whether to download Git-LFS files'
    default: false
  submodules:
    description: >
      Whether to checkout submodules: `true` to checkout submodules or `recursive` to
      recursively checkout submodules.


      When the `ssh-key` input is not provided, SSH URLs beginning with `git@github.com:` are
      converted to HTTPS.
    default: false
  set-safe-directory:
    description: Add repository path as safe.directory for Git global config by running `git config --global --add safe.directory <path>`
    default: true
  github-server-url:
    description: The base URL for the GitHub instance that you are trying to clone from, will use environment defaults to fetch from the same instance that the workflow is running from unless specified. Example URLs are https://github.com or https://my-ghes-server.example.com
    required: false
  allow-unsafe-pr-checkout:
    description: >
      Required to check out fork pull request code from a workflow triggered by
      `pull_request_target` or `workflow_run`. These workflows run with the
      base repository's GITHUB_TOKEN, secrets, default-branch cache scope, and
      runner access; fetching and executing a fork's code in that trusted
      context commonly leads to "pwn request" vulnerabilities. Set to `true`
      only after reviewing the risks at https://gh.io/securely-using-pull_request_target.
    default: false
outputs:
  ref:
    description: 'The branch, tag or SHA that was checked out'
  commit:
    description: 'The commit SHA that was checked out'
runs:
  using: node20
  main: dist/index.js
  post: dist/index.js
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/checkout/contents/action.yml?ref=v5"`

```
name: 'Checkout'
description: 'Checkout a Git repository at a particular version'
inputs:
  repository:
    description: 'Repository name with owner. For example, actions/checkout'
    default: ${{ github.repository }}
  ref:
    description: >
      The branch, tag or SHA to checkout. When checking out the repository that
      triggered a workflow, this defaults to the reference or SHA for that
      event.  Otherwise, uses the default branch.
  token:
    description: >
      Personal access token (PAT) used to fetch the repository. The PAT is configured
      with the local git config, which enables your scripts to run authenticated git
      commands. The post-job step removes the PAT.


      We recommend using a service account with the least permissions necessary.
      Also when generating a new PAT, select the least scopes necessary.


      [Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
    default: ${{ github.token }}
  ssh-key:
    description: >
      SSH key used to fetch the repository. The SSH key is configured with the local
      git config, which enables your scripts to run authenticated git commands.
      The post-job step removes the SSH key.


      We recommend using a service account with the least permissions necessary.


      [Learn more about creating and using
      encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
  ssh-known-hosts:
    description: >
      Known hosts in addition to the user and global host key database. The public
      SSH keys for a host may be obtained using the utility `ssh-keyscan`. For example,
      `ssh-keyscan github.com`. The public key for github.com is always implicitly added.
  ssh-strict:
    description: >
      Whether to perform strict host key checking. When true, adds the options `StrictHostKeyChecking=yes`
      and `CheckHostIP=no` to the SSH command line. Use the input `ssh-known-hosts` to
      configure additional hosts.
    default: true
  ssh-user:
    description: >
      The user to use when connecting to the remote SSH host. By default 'git' is used.
    default: git
  persist-credentials:
    description: 'Whether to configure the token or SSH key with the local git config'
    default: true
  path:
    description: 'Relative path under $GITHUB_WORKSPACE to place the repository'
  clean:
    description: 'Whether to execute `git clean -ffdx && git reset --hard HEAD` before fetching'
    default: true
  filter:
    description: >
      Partially clone against a given filter.
      Overrides sparse-checkout if set.
    default: null
  sparse-checkout:
    description: >
      Do a sparse checkout on given patterns.
      Each pattern should be separated with new lines.
    default: null
  sparse-checkout-cone-mode:
    description: >
      Specifies whether to use cone-mode when doing a sparse checkout.
    default: true
  fetch-depth:
    description: 'Number of commits to fetch. 0 indicates all history for all branches and tags.'
    default: 1
  fetch-tags:
    description: 'Whether to fetch tags, even if fetch-depth > 0.'
    default: false
  show-progress:
    description: 'Whether to show progress status output when fetching.'
    default: true
  lfs:
    description: 'Whether to download Git-LFS files'
    default: false
  submodules:
    description: >
      Whether to checkout submodules: `true` to checkout submodules or `recursive` to
      recursively checkout submodules.


      When the `ssh-key` input is not provided, SSH URLs beginning with `git@github.com:` are
      converted to HTTPS.
    default: false
  set-safe-directory:
    description: Add repository path as safe.directory for Git global config by running `git config --global --add safe.directory <path>`
    default: true
  github-server-url:
    description: The base URL for the GitHub instance that you are trying to clone from, will use environment defaults to fetch from the same instance that the workflow is running from unless specified. Example URLs are https://github.com or https://my-ghes-server.example.com
    required: false
  allow-unsafe-pr-checkout:
    description: >
      Required to check out fork pull request code from a workflow triggered by
      `pull_request_target` or `workflow_run`. These workflows run with the
      base repository's GITHUB_TOKEN, secrets, default-branch cache scope, and
      runner access; fetching and executing a fork's code in that trusted
      context commonly leads to "pwn request" vulnerabilities. Set to `true`
      only after reviewing the risks at https://gh.io/securely-using-pull_request_target.
    default: false
outputs:
  ref:
    description: 'The branch, tag or SHA that was checked out'
  commit:
    description: 'The commit SHA that was checked out'
runs:
  using: node24
  main: dist/index.js
  post: dist/index.js
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/checkout/contents/action.yml?ref=v6"`

```
name: 'Checkout'
description: 'Checkout a Git repository at a particular version'
inputs:
  repository:
    description: 'Repository name with owner. For example, actions/checkout'
    default: ${{ github.repository }}
  ref:
    description: >
      The branch, tag or SHA to checkout. When checking out the repository that
      triggered a workflow, this defaults to the reference or SHA for that
      event.  Otherwise, uses the default branch.
  token:
    description: >
      Personal access token (PAT) used to fetch the repository. The PAT is configured
      with the local git config, which enables your scripts to run authenticated git
      commands. The post-job step removes the PAT.


      We recommend using a service account with the least permissions necessary.
      Also when generating a new PAT, select the least scopes necessary.


      [Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
    default: ${{ github.token }}
  ssh-key:
    description: >
      SSH key used to fetch the repository. The SSH key is configured with the local
      git config, which enables your scripts to run authenticated git commands.
      The post-job step removes the SSH key.


      We recommend using a service account with the least permissions necessary.


      [Learn more about creating and using
      encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
  ssh-known-hosts:
    description: >
      Known hosts in addition to the user and global host key database. The public
      SSH keys for a host may be obtained using the utility `ssh-keyscan`. For example,
      `ssh-keyscan github.com`. The public key for github.com is always implicitly added.
  ssh-strict:
    description: >
      Whether to perform strict host key checking. When true, adds the options `StrictHostKeyChecking=yes`
      and `CheckHostIP=no` to the SSH command line. Use the input `ssh-known-hosts` to
      configure additional hosts.
    default: true
  ssh-user:
    description: >
      The user to use when connecting to the remote SSH host. By default 'git' is used.
    default: git
  persist-credentials:
    description: 'Whether to configure the token or SSH key with the local git config'
    default: true
  path:
    description: 'Relative path under $GITHUB_WORKSPACE to place the repository'
  clean:
    description: 'Whether to execute `git clean -ffdx && git reset --hard HEAD` before fetching'
    default: true
  filter:
    description: >
      Partially clone against a given filter.
      Overrides sparse-checkout if set.
    default: null
  sparse-checkout:
    description: >
      Do a sparse checkout on given patterns.
      Each pattern should be separated with new lines.
    default: null
  sparse-checkout-cone-mode:
    description: >
      Specifies whether to use cone-mode when doing a sparse checkout.
    default: true
  fetch-depth:
    description: 'Number of commits to fetch. 0 indicates all history for all branches and tags.'
    default: 1
  fetch-tags:
    description: 'Whether to fetch tags, even if fetch-depth > 0.'
    default: false
  show-progress:
    description: 'Whether to show progress status output when fetching.'
    default: true
  lfs:
    description: 'Whether to download Git-LFS files'
    default: false
  submodules:
    description: >
      Whether to checkout submodules: `true` to checkout submodules or `recursive` to
      recursively checkout submodules.


      When the `ssh-key` input is not provided, SSH URLs beginning with `git@github.com:` are
      converted to HTTPS.
    default: false
  set-safe-directory:
    description: Add repository path as safe.directory for Git global config by running `git config --global --add safe.directory <path>`
    default: true
  github-server-url:
    description: The base URL for the GitHub instance that you are trying to clone from, will use environment defaults to fetch from the same instance that the workflow is running from unless specified. Example URLs are https://github.com or https://my-ghes-server.example.com
    required: false
  allow-unsafe-pr-checkout:
    description: >
      Required to check out fork pull request code from a workflow triggered by
      `pull_request_target` or `workflow_run`. These workflows run with the
      base repository's GITHUB_TOKEN, secrets, default-branch cache scope, and
      runner access; fetching and executing a fork's code in that trusted
      context commonly leads to "pwn request" vulnerabilities. Set to `true`
      only after reviewing the risks at https://gh.io/securely-using-pull_request_target.
    default: false
outputs:
  ref:
    description: 'The branch, tag or SHA that was checked out'
  commit:
    description: 'The commit SHA that was checked out'
runs:
  using: node24
  main: dist/index.js
  post: dist/index.js
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/checkout/contents/action.yml?ref=v7"`

```
name: 'Checkout'
description: 'Checkout a Git repository at a particular version'
inputs:
  repository:
    description: 'Repository name with owner. For example, actions/checkout'
    default: ${{ github.repository }}
  ref:
    description: >
      The branch, tag or SHA to checkout. When checking out the repository that
      triggered a workflow, this defaults to the reference or SHA for that
      event.  Otherwise, uses the default branch.
  token:
    description: >
      Personal access token (PAT) used to fetch the repository. The PAT is configured
      with the local git config, which enables your scripts to run authenticated git
      commands. The post-job step removes the PAT.


      We recommend using a service account with the least permissions necessary.
      Also when generating a new PAT, select the least scopes necessary.


      [Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
    default: ${{ github.token }}
  ssh-key:
    description: >
      SSH key used to fetch the repository. The SSH key is configured with the local
      git config, which enables your scripts to run authenticated git commands.
      The post-job step removes the SSH key.


      We recommend using a service account with the least permissions necessary.


      [Learn more about creating and using
      encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
  ssh-known-hosts:
    description: >
      Known hosts in addition to the user and global host key database. The public
      SSH keys for a host may be obtained using the utility `ssh-keyscan`. For example,
      `ssh-keyscan github.com`. The public key for github.com is always implicitly added.
  ssh-strict:
    description: >
      Whether to perform strict host key checking. When true, adds the options `StrictHostKeyChecking=yes`
      and `CheckHostIP=no` to the SSH command line. Use the input `ssh-known-hosts` to
      configure additional hosts.
    default: true
  ssh-user:
    description: >
      The user to use when connecting to the remote SSH host. By default 'git' is used.
    default: git
  persist-credentials:
    description: 'Whether to configure the token or SSH key with the local git config'
    default: true
  path:
    description: 'Relative path under $GITHUB_WORKSPACE to place the repository'
  clean:
    description: 'Whether to execute `git clean -ffdx && git reset --hard HEAD` before fetching'
    default: true
  filter:
    description: >
      Partially clone against a given filter.
      Overrides sparse-checkout if set.
    default: null
  sparse-checkout:
    description: >
      Do a sparse checkout on given patterns.
      Each pattern should be separated with new lines.
    default: null
  sparse-checkout-cone-mode:
    description: >
      Specifies whether to use cone-mode when doing a sparse checkout.
    default: true
  fetch-depth:
    description: 'Number of commits to fetch. 0 indicates all history for all branches and tags.'
    default: 1
  fetch-tags:
    description: 'Whether to fetch tags, even if fetch-depth > 0.'
    default: false
  show-progress:
    description: 'Whether to show progress status output when fetching.'
    default: true
  lfs:
    description: 'Whether to download Git-LFS files'
    default: false
  submodules:
    description: >
      Whether to checkout submodules: `true` to checkout submodules or `recursive` to
      recursively checkout submodules.


      When the `ssh-key` input is not provided, SSH URLs beginning with `git@github.com:` are
      converted to HTTPS.
    default: false
  set-safe-directory:
    description: Add repository path as safe.directory for Git global config by running `git config --global --add safe.directory <path>`
    default: true
  github-server-url:
    description: The base URL for the GitHub instance that you are trying to clone from, will use environment defaults to fetch from the same instance that the workflow is running from unless specified. Example URLs are https://github.com or https://my-ghes-server.example.com
    required: false
  allow-unsafe-pr-checkout:
    description: >
      Required to check out fork pull request code from a workflow triggered by
      `pull_request_target` or `workflow_run`. These workflows run with the
      base repository's GITHUB_TOKEN, secrets, default-branch cache scope, and
      runner access; fetching and executing a fork's code in that trusted
      context commonly leads to "pwn request" vulnerabilities. Set to `true`
      only after reviewing the risks at https://gh.io/securely-using-pull_request_target.
    default: false
outputs:
  ref:
    description: 'The branch, tag or SHA that was checked out'
  commit:
    description: 'The commit SHA that was checked out'
runs:
  using: node24
  main: dist/index.js
  post: dist/index.js
```

### 3. Opening release notes of each later major

### `gh release view v5.0.0 --repo actions/checkout`

```
title:	v5.0.0
tag:	v5.0.0
draft:	false
prerelease:	false
immutable:	false
author:	salmanmkc
created:	2025-08-11T12:35:28Z
published:	2025-08-11T12:39:13Z
url:	https://github.com/actions/checkout/releases/tag/v5.0.0
--
## What's Changed
* Update actions checkout to use node 24 by @salmanmkc in https://github.com/actions/checkout/pull/2226
* Prepare v5.0.0 release by @salmanmkc in https://github.com/actions/checkout/pull/2238

## ⚠️ Minimum Compatible Runner Version

**v2.327.1**  
[Release Notes](https://github.com/actions/runner/releases/tag/v2.327.1)

Make sure your runner is updated to this version or newer to use this release.

**Full Changelog**: https://github.com/actions/checkout/compare/v4...v5.0.0
```

### `gh release view v6.0.0 --repo actions/checkout`

```
title:	v6.0.0
tag:	v6.0.0
draft:	false
prerelease:	false
immutable:	false
author:	ericsciple
created:	2025-11-20T16:20:04Z
published:	2025-11-20T16:24:08Z
url:	https://github.com/actions/checkout/releases/tag/v6.0.0
--
## What's Changed
* Update README to include Node.js 24 support details and requirements by @salmanmkc in https://github.com/actions/checkout/pull/2248
* Persist creds to a separate file by @ericsciple in https://github.com/actions/checkout/pull/2286
* v6-beta by @ericsciple in https://github.com/actions/checkout/pull/2298
* update readme/changelog for v6 by @ericsciple in https://github.com/actions/checkout/pull/2311


**Full Changelog**: https://github.com/actions/checkout/compare/v5.0.0...v6.0.0
```

### `gh release view v7.0.0 --repo actions/checkout`

```
title:	v7.0.0
tag:	v7.0.0
draft:	false
prerelease:	false
immutable:	false
author:	aiqiaoy
created:	2026-06-17T17:51:53Z
published:	2026-06-18T13:53:05Z
url:	https://github.com/actions/checkout/releases/tag/v7.0.0
--
## What's Changed
* block checking out fork pr for pull_request_target and workflow_run by @aiqiaoy in https://github.com/actions/checkout/pull/2454
* Bump actions/publish-immutable-action from 0.0.3 to 0.0.4 in the minor-actions-dependencies group across 1 directory by @dependabot[bot] in https://github.com/actions/checkout/pull/2458
* Bump flatted from 3.3.1 to 3.4.2 by @dependabot[bot] in https://github.com/actions/checkout/pull/2460
* Bump js-yaml from 4.1.0 to 4.2.0 by @dependabot[bot] in https://github.com/actions/checkout/pull/2461
* Bump @actions/core and @actions/tool-cache and Remove uuid by @dependabot[bot] in https://github.com/actions/checkout/pull/2459
* upgrade module to esm and update dependencies by @aiqiaoy in https://github.com/actions/checkout/pull/2463
* Bump the minor-npm-dependencies group across 1 directory with 3 updates by @dependabot[bot] in https://github.com/actions/checkout/pull/2462
* getting ready for checkout v7 release by @aiqiaoy in https://github.com/actions/checkout/pull/2464
* update error wording by @aiqiaoy in https://github.com/actions/checkout/pull/2467

## New Contributors
* @aiqiaoy made their first contribution in https://github.com/actions/checkout/pull/2454

**Full Changelog**: https://github.com/actions/checkout/compare/v6.0.3...v7.0.0
```

## actions/setup-node

### 1. Newest non-prerelease release

### `gh release list --repo actions/setup-node --exclude-pre-releases --limit 1`

```
v6.5.0		v6.5.0	2026-07-14T02:51:23Z
```

### 2. action.yml at v4 through v6

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/setup-node/contents/action.yml?ref=v4"`

```
name: 'Setup Node.js environment'
description: 'Setup a Node.js environment by adding problem matchers and optionally downloading and adding it to the PATH.'
author: 'GitHub'
inputs:
  always-auth:
    description: 'Set always-auth in npmrc.'
    default: 'false'
  node-version:
    description: 'Version Spec of the version to use. Examples: 12.x, 10.15.1, >=10.15.0.'
  node-version-file:
    description: 'File containing the version Spec of the version to use.  Examples: package.json, .nvmrc, .node-version, .tool-versions.'
  architecture:
    description: 'Target architecture for Node to use. Examples: x86, x64. Will use system architecture by default.'
  check-latest:
    description: 'Set this option if you want the action to check for the latest available version that satisfies the version spec.'
    default: false
  registry-url:
    description: 'Optional registry to set up for auth. Will set the registry in a project level .npmrc and .yarnrc file, and set up auth to read in from env.NODE_AUTH_TOKEN.'
  scope:
    description: 'Optional scope for authenticating against scoped registries. Will fall back to the repository owner when using the GitHub Packages registry (https://npm.pkg.github.com/).'
  token:
    description: Used to pull node distributions from node-versions. Since there's a default, this is typically not supplied by the user. When running this action on github.com, the default value is sufficient. When running on GHES, you can pass a personal access token for github.com if you are experiencing rate limiting.
    default: ${{ github.server_url == 'https://github.com' && github.token || '' }}
  cache:
    description: 'Used to specify a package manager for caching in the default directory. Supported values: npm, yarn, pnpm.'
  cache-dependency-path:
    description: 'Used to specify the path to a dependency file: package-lock.json, yarn.lock, etc. Supports wildcards or a list of file names for caching multiple dependencies.'
  mirror:
    description: 'Used to specify an alternative mirror to downlooad Node.js binaries from'
  mirror-token:
    description: 'The token used as Authorization header when fetching from the mirror'
# TODO: add input to control forcing to pull from cloud or dist.
#       escape valve for someone having issues or needing the absolute latest which isn't cached yet
outputs:
  cache-hit: 
    description: 'A boolean value to indicate if a cache was hit.'
  node-version:
    description: 'The installed node version.'
runs:
  using: 'node20'
  main: 'dist/setup/index.js'
  post: 'dist/cache-save/index.js'
  post-if: success()
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/setup-node/contents/action.yml?ref=v5"`

```
name: 'Setup Node.js environment'
description: 'Setup a Node.js environment by adding problem matchers and optionally downloading and adding it to the PATH.'
author: 'GitHub'
inputs:
  always-auth:
    description: 'Set always-auth in npmrc.'
    default: 'false'
  node-version:
    description: 'Version Spec of the version to use. Examples: 12.x, 10.15.1, >=10.15.0.'
  node-version-file:
    description: 'File containing the version Spec of the version to use.  Examples: package.json, .nvmrc, .node-version, .tool-versions.'
  architecture:
    description: 'Target architecture for Node to use. Examples: x86, x64. Will use system architecture by default.'
  check-latest:
    description: 'Set this option if you want the action to check for the latest available version that satisfies the version spec.'
    default: false
  registry-url:
    description: 'Optional registry to set up for auth. Will set the registry in a project level .npmrc and .yarnrc file, and set up auth to read in from env.NODE_AUTH_TOKEN.'
  scope:
    description: 'Optional scope for authenticating against scoped registries. Will fall back to the repository owner when using the GitHub Packages registry (https://npm.pkg.github.com/).'
  token:
    description: Used to pull node distributions from node-versions. Since there's a default, this is typically not supplied by the user. When running this action on github.com, the default value is sufficient. When running on GHES, you can pass a personal access token for github.com if you are experiencing rate limiting.
    default: ${{ github.server_url == 'https://github.com' && github.token || '' }}
  cache:
    description: 'Used to specify a package manager for caching in the default directory. Supported values: npm, yarn, pnpm.'
  package-manager-cache:
    description: 'Set to false to disable automatic caching based on the package manager field in package.json. By default, caching is enabled if the package manager field is present.'
    default: true
  cache-dependency-path:
    description: 'Used to specify the path to a dependency file: package-lock.json, yarn.lock, etc. Supports wildcards or a list of file names for caching multiple dependencies.'
  mirror:
    description: 'Used to specify an alternative mirror to downlooad Node.js binaries from'
  mirror-token:
    description: 'The token used as Authorization header when fetching from the mirror'
# TODO: add input to control forcing to pull from cloud or dist.
#       escape valve for someone having issues or needing the absolute latest which isn't cached yet
outputs:
  cache-hit: 
    description: 'A boolean value to indicate if a cache was hit.'
  node-version:
    description: 'The installed node version.'
runs:
  using: 'node24'
  main: 'dist/setup/index.js'
  post: 'dist/cache-save/index.js'
  post-if: success()
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/setup-node/contents/action.yml?ref=v6"`

```
name: 'Setup Node.js environment'
description: 'Setup a Node.js environment by adding problem matchers and optionally downloading and adding it to the PATH.'
author: 'GitHub'
inputs:
  node-version:
    description: 'Version Spec of the version to use. Examples: 12.x, 10.15.1, >=10.15.0.'
  node-version-file:
    description: 'File containing the version Spec of the version to use.  Examples: package.json, .nvmrc, .node-version, .tool-versions.'
  architecture:
    description: 'Target architecture for Node to use. Examples: x86, x64. Will use system architecture by default.'
  check-latest:
    description: 'Set this option if you want the action to check for the latest available version that satisfies the version spec.'
    default: false
  registry-url:
    description: 'Optional registry to set up for auth. Will set the registry in a project level .npmrc and .yarnrc file, and set up auth to read in from env.NODE_AUTH_TOKEN.'
  scope:
    description: 'Optional scope for authenticating against scoped registries. Will fall back to the repository owner when using the GitHub Packages registry (https://npm.pkg.github.com/).'
  token:
    description: Used to pull node distributions from node-versions. Since there's a default, this is typically not supplied by the user. When running this action on github.com, the default value is sufficient. When running on GHES, you can pass a personal access token for github.com if you are experiencing rate limiting.
    default: ${{ github.server_url == 'https://github.com' && github.token || '' }}
  cache:
    description: 'Used to specify a package manager for caching in the default directory. Supported values: npm, yarn, pnpm.'
  package-manager-cache:
    description: 'Set to false to disable automatic caching. By default, caching is enabled when either devEngines.packageManager or the top-level packageManager field in package.json specifies npm as the package manager.'
    default: true
  cache-dependency-path:
    description: 'Used to specify the path to a dependency file: package-lock.json, yarn.lock, etc. Supports wildcards or a list of file names for caching multiple dependencies.'
  mirror:
    description: 'Used to specify an alternative mirror to download Node.js binaries from'
  mirror-token:
    description: 'The token used as Authorization header when fetching from the mirror'
# TODO: add input to control forcing to pull from cloud or dist.
#       escape valve for someone having issues or needing the absolute latest which isn't cached yet
outputs:
  cache-hit:
    description: 'A boolean value to indicate if a cache was hit.'
  node-version:
    description: 'The installed node version.'
runs:
  using: 'node24'
  main: 'dist/setup/index.js'
  post: 'dist/cache-save/index.js'
  post-if: success()
```

### 3. Opening release notes of each later major

### `gh release view v5.0.0 --repo actions/setup-node`

```
title:	v5.0.0
tag:	v5.0.0
draft:	false
prerelease:	false
immutable:	false
author:	v-gowridurgad
created:	2025-09-03T17:47:21Z
published:	2025-09-04T02:52:29Z
url:	https://github.com/actions/setup-node/releases/tag/v5.0.0
--
## What's Changed

### Breaking Changes
* Enhance caching in setup-node with automatic package manager detection by @priya-kinthali in https://github.com/actions/setup-node/pull/1348

This update, introduces automatic caching when a valid `packageManager` field is present in your `package.json`. This aims to improve workflow performance and make dependency management more seamless. 
To disable this automatic caching, set `package-manager-cache: false`
```yaml
steps:
- uses: actions/checkout@v5
- uses: actions/setup-node@v5
  with:
    package-manager-cache: false
```
* Upgrade action to use node24 by @salmanmkc in https://github.com/actions/setup-node/pull/1325

Make sure your runner is on version v2.327.1 or later to ensure compatibility with this release. [See Release Notes](https://github.com/actions/runner/releases/tag/v2.327.1)


### Dependency Upgrades
* Upgrade @octokit/request-error and @actions/github by @dependabot[bot] in https://github.com/actions/setup-node/pull/1227
* Upgrade uuid from 9.0.1 to 11.1.0 by @dependabot[bot] in https://github.com/actions/setup-node/pull/1273
* Upgrade undici from 5.28.5 to 5.29.0 by @dependabot[bot] in https://github.com/actions/setup-node/pull/1295
* Upgrade form-data to bring in fix for critical vulnerability by @gowridurgad in https://github.com/actions/setup-node/pull/1332
* Upgrade actions/checkout from 4 to 5 by @dependabot[bot] in https://github.com/actions/setup-node/pull/1345

## New Contributors
* @priya-kinthali made their first contribution in https://github.com/actions/setup-node/pull/1348
* @salmanmkc made their first contribution in https://github.com/actions/setup-node/pull/1325

**Full Changelog**: https://github.com/actions/setup-node/compare/v4...v5.0.0
```

### `gh release view v6.0.0 --repo actions/setup-node`

```
title:	v6.0.0
tag:	v6.0.0
draft:	false
prerelease:	false
immutable:	false
author:	v-HarithaVattikuti
created:	2025-10-14T02:37:06Z
published:	2025-10-14T02:55:17Z
url:	https://github.com/actions/setup-node/releases/tag/v6.0.0
--
## What's Changed

**Breaking Changes**

- Limit automatic caching to npm, update workflows and documentation by @priyagupta108 in https://github.com/actions/setup-node/pull/1374

**Dependency Upgrades**

- Upgrade ts-jest from 29.1.2 to 29.4.1 and document breaking changes in v5 by @dependabot[bot] in [#1336](https://github.com/actions/setup-node/pull/1336)
- Upgrade prettier from 2.8.8 to 3.6.2 by @dependabot[bot] in [#1334](https://github.com/actions/setup-node/pull/1334)
- Upgrade actions/publish-action from 0.3.0 to 0.4.0 by @dependabot[bot] in [#1362](https://github.com/actions/setup-node/pull/1362)


**Full Changelog**: https://github.com/actions/setup-node/compare/v5...v6.0.0
```

## actions/cache

### 1. Newest non-prerelease release

### `gh release list --repo actions/cache --exclude-pre-releases --limit 1`

```
v5.1.0		v5.1.0	2026-06-26T20:21:47Z
```

### 2. action.yml at v4 through v5

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/cache/contents/action.yml?ref=v4"`

```
name: 'Cache'
description: 'Cache artifacts like dependencies and build outputs to improve workflow execution time'
author: 'GitHub'
inputs:
  path:
    description: 'A list of files, directories, and wildcard patterns to cache and restore'
    required: true
  key:
    description: 'An explicit key for restoring and saving the cache'
    required: true
  restore-keys:
    description: 'An ordered multiline string listing the prefix-matched keys, that are used for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case.'
    required: false
  upload-chunk-size:
    description: 'The chunk size used to split up large files during upload, in bytes'
    required: false
  enableCrossOsArchive:
    description: 'An optional boolean when enabled, allows windows runners to save or restore caches that can be restored or saved respectively on other platforms'
    default: 'false'
    required: false
  fail-on-cache-miss:
    description: 'Fail the workflow if cache entry is not found'
    default: 'false'
    required: false
  lookup-only:
    description: 'Check if a cache entry exists for the given input(s) (key, restore-keys) without downloading the cache'
    default: 'false'
    required: false
  save-always:
    description: 'Run the post step to save the cache even if another step before fails'
    default: 'false'
    required: false
    deprecationMessage: |
      save-always does not work as intended and will be removed in a future release.
      A separate `actions/cache/restore` step should be used instead.
      See https://github.com/actions/cache/tree/main/save#always-save-cache for more details.
outputs:
  cache-hit:
    description: 'A boolean value to indicate an exact match was found for the primary key'
runs:
  using: 'node20'
  main: 'dist/restore/index.js'
  post: 'dist/save/index.js'
  post-if: "success()"
branding:
  icon: 'archive'
  color: 'gray-dark'
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/cache/contents/restore/action.yml?ref=v4"`

```
name: 'Restore Cache'
description: 'Restore Cache artifacts like dependencies and build outputs to improve workflow execution time'
author: 'GitHub'
inputs:
  path:
    description: 'A list of files, directories, and wildcard patterns to restore'
    required: true
  key:
    description: 'An explicit key for restoring the cache'
    required: true
  restore-keys:
    description: 'An ordered multiline string listing the prefix-matched keys, that are used for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case.'
    required: false
  enableCrossOsArchive:
    description: 'An optional boolean when enabled, allows windows runners to restore caches that were saved on other platforms'
    default: 'false'
    required: false
  fail-on-cache-miss:
    description: 'Fail the workflow if cache entry is not found'
    default: 'false'
    required: false
  lookup-only:
    description: 'Check if a cache entry exists for the given input(s) (key, restore-keys) without downloading the cache'
    default: 'false'
    required: false
outputs:
  cache-hit:
    description: 'A boolean value to indicate an exact match was found for the primary key'
  cache-primary-key:
    description: 'A resolved cache key for which cache match was attempted'
  cache-matched-key:
    description: 'Key of the cache that was restored, it could either be the primary key on cache-hit or a partial/complete match of one of the restore keys'
runs:
  using: 'node20'
  main: '../dist/restore-only/index.js'
branding:
  icon: 'archive'
  color: 'gray-dark'
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/cache/contents/action.yml?ref=v5"`

```
name: 'Cache'
description: 'Cache artifacts like dependencies and build outputs to improve workflow execution time'
author: 'GitHub'
inputs:
  path:
    description: 'A list of files, directories, and wildcard patterns to cache and restore'
    required: true
  key:
    description: 'An explicit key for restoring and saving the cache'
    required: true
  restore-keys:
    description: 'An ordered multiline string listing the prefix-matched keys, that are used for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case.'
    required: false
  upload-chunk-size:
    description: 'The chunk size used to split up large files during upload, in bytes'
    required: false
  enableCrossOsArchive:
    description: 'An optional boolean when enabled, allows windows runners to save or restore caches that can be restored or saved respectively on other platforms'
    default: 'false'
    required: false
  fail-on-cache-miss:
    description: 'Fail the workflow if cache entry is not found'
    default: 'false'
    required: false
  lookup-only:
    description: 'Check if a cache entry exists for the given input(s) (key, restore-keys) without downloading the cache'
    default: 'false'
    required: false
  save-always:
    description: 'Run the post step to save the cache even if another step before fails'
    default: 'false'
    required: false
    deprecationMessage: |
      save-always does not work as intended and will be removed in a future release.
      A separate `actions/cache/restore` step should be used instead.
      See https://github.com/actions/cache/tree/main/save#always-save-cache for more details.
outputs:
  cache-hit:
    description: 'A boolean value to indicate an exact match was found for the primary key'
runs:
  using: 'node24'
  main: 'dist/restore/index.js'
  post: 'dist/save/index.js'
  post-if: "success()"
branding:
  icon: 'archive'
  color: 'gray-dark'
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/cache/contents/restore/action.yml?ref=v5"`

```
name: 'Restore Cache'
description: 'Restore Cache artifacts like dependencies and build outputs to improve workflow execution time'
author: 'GitHub'
inputs:
  path:
    description: 'A list of files, directories, and wildcard patterns to restore'
    required: true
  key:
    description: 'An explicit key for restoring the cache'
    required: true
  restore-keys:
    description: 'An ordered multiline string listing the prefix-matched keys, that are used for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case.'
    required: false
  enableCrossOsArchive:
    description: 'An optional boolean when enabled, allows windows runners to restore caches that were saved on other platforms'
    default: 'false'
    required: false
  fail-on-cache-miss:
    description: 'Fail the workflow if cache entry is not found'
    default: 'false'
    required: false
  lookup-only:
    description: 'Check if a cache entry exists for the given input(s) (key, restore-keys) without downloading the cache'
    default: 'false'
    required: false
outputs:
  cache-hit:
    description: 'A boolean value to indicate an exact match was found for the primary key'
  cache-primary-key:
    description: 'A resolved cache key for which cache match was attempted'
  cache-matched-key:
    description: 'Key of the cache that was restored, it could either be the primary key on cache-hit or a partial/complete match of one of the restore keys'
runs:
  using: 'node24'
  main: '../dist/restore-only/index.js'
branding:
  icon: 'archive'
  color: 'gray-dark'
```

### 3. Opening release notes of each later major

### `gh release view v5.0.0 --repo actions/cache`

```
title:	v5.0.0
tag:	v5.0.0
draft:	false
prerelease:	false
immutable:	false
author:	salmanmkc
created:	2025-12-11T21:15:52Z
published:	2025-12-11T21:19:59Z
url:	https://github.com/actions/cache/releases/tag/v5.0.0
--
> [!IMPORTANT]
> **`actions/cache@v5` runs on the Node.js 24 runtime and requires a minimum Actions Runner version of `2.327.1`.**
>  
> If you are using self-hosted runners, ensure they are updated before upgrading.

---


## What's Changed
* Upgrade to use node24 by @salmanmkc in https://github.com/actions/cache/pull/1630
* Prepare v5.0.0 release by @salmanmkc in https://github.com/actions/cache/pull/1684



**Full Changelog**: https://github.com/actions/cache/compare/v4.3.0...v5.0.0
```

## actions/upload-artifact

### 1. Newest non-prerelease release

### `gh release list --repo actions/upload-artifact --exclude-pre-releases --limit 1`

```
v7.0.1	Latest	v7.0.1	2026-04-10T17:31:14Z
```

### 2. action.yml at v4 through v7

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/upload-artifact/contents/action.yml?ref=v4"`

```
name: 'Upload a Build Artifact'
description: 'Upload a build artifact that can be used by subsequent workflow steps'
author: 'GitHub'
inputs:
  name:
    description: 'Artifact name'
    default: 'artifact'
  path:
    description: 'A file, directory or wildcard pattern that describes what to upload'
    required: true
  if-no-files-found:
    description: >
      The desired behavior if no files are found using the provided path.

      Available Options:
        warn: Output a warning but do not fail the action
        error: Fail the action with an error message
        ignore: Do not output any warnings or errors, the action does not fail
    default: 'warn'
  retention-days:
    description: >
      Duration after which artifact will expire in days. 0 means using default retention.

      Minimum 1 day.
      Maximum 90 days unless changed from the repository settings page.
  compression-level:
    description: >
      The level of compression for Zlib to be applied to the artifact archive.
      The value can range from 0 to 9:
      - 0: No compression
      - 1: Best speed
      - 6: Default compression (same as GNU Gzip)
      - 9: Best compression
      Higher levels will result in better compression, but will take longer to complete.
      For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
    default: '6'
  overwrite:
    description: >
      If true, an artifact with a matching name will be deleted before a new one is uploaded.
      If false, the action will fail if an artifact for the given name already exists.
      Does not fail if the artifact does not exist.
    default: 'false'
  include-hidden-files:
    description: >
      If true, hidden files will be included in the artifact.
      If false, hidden files will be excluded from the artifact.
    default: 'false'

outputs:
  artifact-id:
    description: >
      A unique identifier for the artifact that was just uploaded. Empty if the artifact upload failed.

      This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts
  artifact-url:
    description: >
      A download URL for the artifact that was just uploaded. Empty if the artifact upload failed.

      This download URL only works for requests Authenticated with GitHub. Anonymous downloads will be prompted to first login. 
      If an anonymous download URL is needed than a short time restricted URL can be generated using the download artifact API: https://docs.github.com/en/rest/actions/artifacts#download-an-artifact    

      This URL will be valid for as long as the artifact exists and the workflow run and repository exists. Once an artifact has expired this URL will no longer work.
      Common uses cases for such a download URL can be adding download links to artifacts in descriptions or comments on pull requests or issues.
  artifact-digest:
    description: >
      SHA-256 digest for the artifact that was just uploaded. Empty if the artifact upload failed.
runs:
  using: 'node20'
  main: 'dist/upload/index.js'
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/upload-artifact/contents/action.yml?ref=v5"`

```
name: 'Upload a Build Artifact'
description: 'Upload a build artifact that can be used by subsequent workflow steps'
author: 'GitHub'
inputs:
  name:
    description: 'Artifact name'
    default: 'artifact'
  path:
    description: 'A file, directory or wildcard pattern that describes what to upload'
    required: true
  if-no-files-found:
    description: >
      The desired behavior if no files are found using the provided path.

      Available Options:
        warn: Output a warning but do not fail the action
        error: Fail the action with an error message
        ignore: Do not output any warnings or errors, the action does not fail
    default: 'warn'
  retention-days:
    description: >
      Duration after which artifact will expire in days. 0 means using default retention.

      Minimum 1 day.
      Maximum 90 days unless changed from the repository settings page.
  compression-level:
    description: >
      The level of compression for Zlib to be applied to the artifact archive.
      The value can range from 0 to 9:
      - 0: No compression
      - 1: Best speed
      - 6: Default compression (same as GNU Gzip)
      - 9: Best compression
      Higher levels will result in better compression, but will take longer to complete.
      For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
    default: '6'
  overwrite:
    description: >
      If true, an artifact with a matching name will be deleted before a new one is uploaded.
      If false, the action will fail if an artifact for the given name already exists.
      Does not fail if the artifact does not exist.
    default: 'false'
  include-hidden-files:
    description: >
      If true, hidden files will be included in the artifact.
      If false, hidden files will be excluded from the artifact.
    default: 'false'

outputs:
  artifact-id:
    description: >
      A unique identifier for the artifact that was just uploaded. Empty if the artifact upload failed.

      This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts
  artifact-url:
    description: >
      A download URL for the artifact that was just uploaded. Empty if the artifact upload failed.

      This download URL only works for requests Authenticated with GitHub. Anonymous downloads will be prompted to first login. 
      If an anonymous download URL is needed than a short time restricted URL can be generated using the download artifact API: https://docs.github.com/en/rest/actions/artifacts#download-an-artifact    

      This URL will be valid for as long as the artifact exists and the workflow run and repository exists. Once an artifact has expired this URL will no longer work.
      Common uses cases for such a download URL can be adding download links to artifacts in descriptions or comments on pull requests or issues.
  artifact-digest:
    description: >
      SHA-256 digest for the artifact that was just uploaded. Empty if the artifact upload failed.
runs:
  using: 'node20'
  main: 'dist/upload/index.js'
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/upload-artifact/contents/action.yml?ref=v6"`

```
name: 'Upload a Build Artifact'
description: 'Upload a build artifact that can be used by subsequent workflow steps'
author: 'GitHub'
inputs:
  name:
    description: 'Artifact name'
    default: 'artifact'
  path:
    description: 'A file, directory or wildcard pattern that describes what to upload'
    required: true
  if-no-files-found:
    description: >
      The desired behavior if no files are found using the provided path.

      Available Options:
        warn: Output a warning but do not fail the action
        error: Fail the action with an error message
        ignore: Do not output any warnings or errors, the action does not fail
    default: 'warn'
  retention-days:
    description: >
      Duration after which artifact will expire in days. 0 means using default retention.

      Minimum 1 day.
      Maximum 90 days unless changed from the repository settings page.
  compression-level:
    description: >
      The level of compression for Zlib to be applied to the artifact archive.
      The value can range from 0 to 9:
      - 0: No compression
      - 1: Best speed
      - 6: Default compression (same as GNU Gzip)
      - 9: Best compression
      Higher levels will result in better compression, but will take longer to complete.
      For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
    default: '6'
  overwrite:
    description: >
      If true, an artifact with a matching name will be deleted before a new one is uploaded.
      If false, the action will fail if an artifact for the given name already exists.
      Does not fail if the artifact does not exist.
    default: 'false'
  include-hidden-files:
    description: >
      If true, hidden files will be included in the artifact.
      If false, hidden files will be excluded from the artifact.
    default: 'false'

outputs:
  artifact-id:
    description: >
      A unique identifier for the artifact that was just uploaded. Empty if the artifact upload failed.

      This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts
  artifact-url:
    description: >
      A download URL for the artifact that was just uploaded. Empty if the artifact upload failed.

      This download URL only works for requests Authenticated with GitHub. Anonymous downloads will be prompted to first login. 
      If an anonymous download URL is needed than a short time restricted URL can be generated using the download artifact API: https://docs.github.com/en/rest/actions/artifacts#download-an-artifact    

      This URL will be valid for as long as the artifact exists and the workflow run and repository exists. Once an artifact has expired this URL will no longer work.
      Common uses cases for such a download URL can be adding download links to artifacts in descriptions or comments on pull requests or issues.
  artifact-digest:
    description: >
      SHA-256 digest for the artifact that was just uploaded. Empty if the artifact upload failed.
runs:
  using: 'node24'
  main: 'dist/upload/index.js'
```

### `gh api -H "Accept: application/vnd.github.raw" "repos/actions/upload-artifact/contents/action.yml?ref=v7"`

```
name: 'Upload a Build Artifact'
description: 'Upload a build artifact that can be used by subsequent workflow steps'
author: 'GitHub'
inputs:
  name:
    description: 'Artifact name. If the `archive` input is `false`, the name of the file uploaded will be the artifact name.'
    default: 'artifact'
  path:
    description: 'A file, directory or wildcard pattern that describes what to upload.'
    required: true
  if-no-files-found:
    description: >
      The desired behavior if no files are found using the provided path.

      Available Options:
        warn: Output a warning but do not fail the action
        error: Fail the action with an error message
        ignore: Do not output any warnings or errors, the action does not fail
    default: 'warn'
  retention-days:
    description: >
      Duration after which artifact will expire in days. 0 means using default retention.

      Minimum 1 day.
      Maximum 90 days unless changed from the repository settings page.
  compression-level:
    description: >
      The level of compression for Zlib to be applied to the artifact archive.
      The value can range from 0 to 9:
      - 0: No compression
      - 1: Best speed
      - 6: Default compression (same as GNU Gzip)
      - 9: Best compression
      Higher levels will result in better compression, but will take longer to complete.
      For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
    default: '6'
  overwrite:
    description: >
      If true, an artifact with a matching name will be deleted before a new one is uploaded.
      If false, the action will fail if an artifact for the given name already exists.
      Does not fail if the artifact does not exist.
    default: 'false'
  include-hidden-files:
    description: >
      If true, hidden files will be included in the artifact.
      If false, hidden files will be excluded from the artifact.
    default: 'false'
  archive:
    description: >
      If true, the artifact will be archived (zipped) before uploading.
      If false, the artifact will be uploaded as-is without archiving.
      When `archive` is `false`, only a single file can be uploaded. The name of the file will be used as the artifact name (ignoring the `name` parameter).
    default: 'true'

outputs:
  artifact-id:
    description: >
      A unique identifier for the artifact that was just uploaded. Empty if the artifact upload failed.

      This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts
  artifact-url:
    description: >
      A download URL for the artifact that was just uploaded. Empty if the artifact upload failed.

      This download URL only works for requests Authenticated with GitHub. Anonymous downloads will be prompted to first login. 
      If an anonymous download URL is needed than a short time restricted URL can be generated using the download artifact API: https://docs.github.com/en/rest/actions/artifacts#download-an-artifact    

      This URL will be valid for as long as the artifact exists and the workflow run and repository exists. Once an artifact has expired this URL will no longer work.
      Common uses cases for such a download URL can be adding download links to artifacts in descriptions or comments on pull requests or issues.
  artifact-digest:
    description: >
      SHA-256 digest for the artifact that was just uploaded. Empty if the artifact upload failed.
runs:
  using: 'node24'
  main: 'dist/upload/index.js'
```

### 3. Opening release notes of each later major

### `gh release view v5.0.0 --repo actions/upload-artifact`

```
title:	v5.0.0
tag:	v5.0.0
draft:	false
prerelease:	false
immutable:	false
author:	danwkennedy
created:	2025-10-24T18:15:34Z
published:	2025-10-24T18:19:29Z
url:	https://github.com/actions/upload-artifact/releases/tag/v5.0.0
--
## What's Changed

**BREAKING CHANGE:** this update supports Node `v24.x`. This is not a breaking change per-se but we're treating it as such.

* Update README.md by @GhadimiR in https://github.com/actions/upload-artifact/pull/681
* Update README.md by @nebuk89 in https://github.com/actions/upload-artifact/pull/712
* Readme: spell out the first use of GHES by @danwkennedy in https://github.com/actions/upload-artifact/pull/727
* Update GHES guidance to include reference to Node 20 version by @patrikpolyak in https://github.com/actions/upload-artifact/pull/725
* Bump `@actions/artifact` to `v4.0.0`
* Prepare `v5.0.0` by @danwkennedy in https://github.com/actions/upload-artifact/pull/734

## New Contributors
* @GhadimiR made their first contribution in https://github.com/actions/upload-artifact/pull/681
* @nebuk89 made their first contribution in https://github.com/actions/upload-artifact/pull/712
* @danwkennedy made their first contribution in https://github.com/actions/upload-artifact/pull/727
* @patrikpolyak made their first contribution in https://github.com/actions/upload-artifact/pull/725

**Full Changelog**: https://github.com/actions/upload-artifact/compare/v4...v5.0.0
```

### `gh release view v6.0.0 --repo actions/upload-artifact`

```
title:	v6.0.0
tag:	v6.0.0
draft:	false
prerelease:	false
immutable:	false
author:	salmanmkc
created:	2025-12-12T17:58:04Z
published:	2025-12-12T18:51:31Z
url:	https://github.com/actions/upload-artifact/releases/tag/v6.0.0
--
## v6 - What's new

> [!IMPORTANT]
> actions/upload-artifact@v6 now runs on Node.js 24 (`runs.using: node24`) and requires a minimum Actions Runner version of 2.327.1. If you are using self-hosted runners, ensure they are updated before upgrading.
### Node.js 24

This release updates the runtime to Node.js 24. v5 had preliminary support for Node.js 24, however this action was by default still running on Node.js 20. Now this action by default will run on Node.js 24.

## What's Changed
* Upload Artifact Node 24 support by @salmanmkc in https://github.com/actions/upload-artifact/pull/719
* fix: update @actions/artifact for Node.js 24 punycode deprecation by @salmanmkc in https://github.com/actions/upload-artifact/pull/744
* prepare release v6.0.0 for Node.js 24 support by @salmanmkc in https://github.com/actions/upload-artifact/pull/745


**Full Changelog**: https://github.com/actions/upload-artifact/compare/v5.0.0...v6.0.0
```

### `gh release view v7.0.0 --repo actions/upload-artifact`

```
title:	v7.0.0
tag:	v7.0.0
draft:	false
prerelease:	false
immutable:	false
author:	danwkennedy
created:	2026-02-25T21:04:27Z
published:	2026-02-26T18:21:17Z
url:	https://github.com/actions/upload-artifact/releases/tag/v7.0.0
--
## v7 What's new

### Direct Uploads

Adds support for uploading single files directly (unzipped). Callers can set the new `archive` parameter to `false` to skip zipping the file during upload. Right now, we only support single files. The action will fail if the glob passed resolves to multiple files. The `name` parameter is also ignored with this setting. Instead, the name of the artifact will be the name of the uploaded file.

### ESM

To support new versions of the `@actions/*` packages, we've upgraded the package to ESM.

## What's Changed
* Add proxy integration test by @Link- in https://github.com/actions/upload-artifact/pull/754
* Upgrade the module to ESM and bump dependencies by @danwkennedy in https://github.com/actions/upload-artifact/pull/762
* Support direct file uploads by @danwkennedy in https://github.com/actions/upload-artifact/pull/764

## New Contributors
* @Link- made their first contribution in https://github.com/actions/upload-artifact/pull/754

**Full Changelog**: https://github.com/actions/upload-artifact/compare/v6...v7.0.0
```

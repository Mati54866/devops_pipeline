# DevOps Pipeline CLI

A dependency-free Node.js example for generating messages in CI workflows. It
supports configurable greetings, text/JSON/NDJSON output, local files, and
GitHub Actions output and step summaries.

The repository root contains the GitHub Actions workflows; this directory
contains the runnable CLI. See the [repository overview](../../README.md) for
the automation workflows.

## Requirements and installation

Use Node.js 22 or newer. From this directory, install the exact dependency tree
recorded in the lockfile:

```sh
npm ci
```

The CLI has no runtime dependencies; `npm ci` is useful for reproducing the
project's package setup and running its development checks.

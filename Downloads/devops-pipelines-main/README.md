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

## Quick start

Run the default example:

```sh
npm start
```

Customize the greeting or add messages to a run:

```sh
npm start -- --name Ada
npm start -- --name Ada --message "Build started" --message "Deploy complete"
```

Options after `--` are passed to the CLI.

## JSON configuration

Use `--config <file>` to load reusable defaults. The
[`devops.config.example.json`](devops.config.example.json) file shows all
supported settings:

```sh
npm start -- --config devops.config.example.json
```

Configuration files must contain a JSON object. The supported keys are
`name`, `messages` (an array of non-empty strings), `format` (`text`, `json`,
or `ndjson`), `separator` (text output only), and `uppercase` (a boolean).
Unknown keys and invalid values are rejected with an error.

## Environment and precedence

Set `DEVOPS_GREETING_NAME` to provide a default name. For the name, values are
selected in this order: `--name`, `DEVOPS_GREETING_NAME`, the config file's
`name`, then `DevOps`. Command-line format and presentation options also
override corresponding config values.

```sh
DEVOPS_GREETING_NAME=Grace npm start
npm start -- --config devops.config.example.json --name Ada
```

Machine-specific settings can go in `devops.config.local.json`; that filename
is ignored by Git. Pass it explicitly with `--config`.

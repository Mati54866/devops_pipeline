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

## Output formats

Text is the default output. JSON produces one array, while NDJSON produces
one JSON-encoded message per line:

```sh
npm start -- --format text
npm start -- --format json
npm start -- --format ndjson
```

For text output, `--separator` joins the messages into one line, and
`--uppercase` capitalizes each message:

```sh
npm start -- --separator " | "
npm start -- --uppercase
```

The `--json` and `-j` options are shorthand for `--format json`.

## Files and standard input

Use `--output` to write the result to a file instead of standard output.
`--append` adds another run to an existing file; it requires `--output` and
works with text or NDJSON, not JSON arrays.

```sh
npm start -- --output build-messages.txt
npm start -- --format ndjson --output build-messages.ndjson --append
```

Provide `-` as the name to read it from standard input:

```sh
printf "Ada\n" | npm start -- --name -
```

## GitHub Actions integration

The CLI can write a `messages` step output with `--github-output` and append a
Markdown list to the job summary with `--github-summary`. GitHub Actions
provides the required `GITHUB_OUTPUT` and `GITHUB_STEP_SUMMARY` paths:

```yaml
- name: Generate pipeline messages
  id: messages
  run: npm start -- --github-output --github-summary

- name: Use the messages
  env:
    PIPELINE_MESSAGES: ${{ steps.messages.outputs.messages }}
  run: printf '%s\n' "$PIPELINE_MESSAGES"
```

These options can be combined with `--format`, but not with `--output` or
`--append`.

## Troubleshooting

- Run `npm start -- --help` to see the available options, or
  `npm start -- --version` to print the package version.
- An unknown option or invalid option value exits with status `2`. Check
  option spelling and the required values.
- A configuration or output-file read/write failure exits with status `1`.
  Confirm the file exists where expected and that the process can access it.
- `--append` needs `--output` and cannot be used with JSON array output.
- GitHub Actions output modes require their runner-provided environment
  variables; run those options from a workflow step.

## Development

The project uses Node's built-in test runner and includes syntax and behavior
checks:

```sh
npm run check
npm test
npm run validate
```

The CI workflow runs the validation on Linux and Windows across Node.js 22,
24, and 26. See the repository's [contribution guide](../../CONTRIBUTING.md)
for pull request expectations.

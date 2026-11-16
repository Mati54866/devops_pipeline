# DevOps Pipelines CLI

A dependency-free Node.js command-line example for practicing CI/CD workflows.
It generates configurable messages and can write text, JSON, or NDJSON to
standard output, a file, or GitHub Actions workflow files.

## Requirements

- Node.js 22 or newer
- npm (included with Node.js)

## Quick start

```sh
cd Downloads/devops-pipelines-main
npm start
```

Run the bundled configuration, render it as JSON, or inspect all options:

```sh
npm run start:example
npm run start:example:json
npm start -- --help
```

## CLI examples

Options are passed to the application after npm's `--` separator:

```sh
# Customize the greeting and add messages
npm start -- --name Ada --message "Build started" --message "Deploy complete"

# Choose a machine-readable format
npm start -- --format json
npm start -- --format ndjson

# Write to a file, or append text/NDJSON to an existing file
npm start -- --output run.log
npm start -- --format ndjson --output events.ndjson --append

# Load a config file, or validate it without generating messages
npm start -- --config devops.config.example.json
npm run validate:config -- --config devops.config.example.json

# Read the greeting name from standard input
printf "Ada\n" | npm start -- --name -
```

Use `npm start -- --help` for the complete option list. The CLI supports
repeatable `--message`, `--separator`, `--uppercase`, and `--no-uppercase`
options. JSON array output cannot be appended; text and NDJSON output can.

## Configuration

`--config <file>` loads a JSON object with these optional properties:

| Property | Type | Description |
| --- | --- | --- |
| `name` | string | Default greeting name |
| `messages` | array of non-empty strings | Additional messages |
| `format` | `text`, `json`, or `ndjson` | Default output format |
| `separator` | string | Separator for text output only |
| `uppercase` | boolean | Convert all messages to uppercase |

See [`devops.config.example.json`](./devops.config.example.json) for a working
configuration and [`devops.config.schema.json`](./devops.config.schema.json)
for the JSON Schema. `devops.config.local.json` is ignored by Git and can be
used for machine-specific settings.

### Environment variables

Environment values provide defaults; command-line options take precedence.
Config values are used when neither is set.

| Variable | Expected value |
| --- | --- |
| `DEVOPS_CONFIG` | Path to a JSON configuration file |
| `DEVOPS_GREETING_NAME` | Default greeting name |
| `DEVOPS_MESSAGES` | JSON array of non-empty strings |
| `DEVOPS_FORMAT` | `text`, `json`, or `ndjson` |
| `DEVOPS_SEPARATOR` | Text output separator |
| `DEVOPS_UPPERCASE` | `true` or `false` |
| `DEVOPS_OUTPUT` | Default output file path |

The [` .env.example`](./.env.example) file lists the supported variables.
Environment variables are read from the process environment; the CLI does not
load `.env` files automatically.

## GitHub Actions

The CLI can write a named `messages` output to `GITHUB_OUTPUT`, append a
Markdown summary to `GITHUB_STEP_SUMMARY`, or do both:

```yaml
- name: Export pipeline messages
  run: node index.js --github-output --github-summary
```

GitHub Actions provides these file paths to workflow steps. These options
cannot be combined with `--output` or `--append`.

## Development and validation

Install from the lockfile and run the project's validation command:

```sh
npm ci
npm run validate
```

Validation checks JavaScript syntax, validates the example configuration, and
runs the test suite. Run only the tests with `npm test`.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Command completed successfully |
| `1` | A file could not be read or written |
| `2` | Invalid arguments, environment values, or configuration |

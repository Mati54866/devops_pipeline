# Contributing

## Development setup

The Node.js example lives in `Downloads/devops-pipelines-main`. Use Node.js 22
or newer, then install from the lockfile:

```sh
cd Downloads/devops-pipelines-main
npm ci
```

Run the local validation commands before opening a pull request:

```sh
npm run check
npm test
```

The GitHub Actions workflow runs the same validation on Linux and Windows
against the supported Node.js versions.

## CLI options

Run the example with `npm start`. Options can be combined:

```sh
npm start -- --name Ada --format json
npm start -- --message "Build complete" --output run.log --append
```

Use `--config <file>` to load JSON defaults for `name`, `messages`, `format`,
`separator`, and `uppercase`. A config file may only be specified once.
Precedence is command-line options, then `DEVOPS_GREETING_NAME`, then config
values, then built-in defaults. Set `DEVOPS_CONFIG` to select a config file
without passing `--config`; the command-line option takes precedence. Keep
machine-specific configuration in
`devops.config.local.json`; local configuration and environment files are
ignored by Git.

The CLI also supports `--help`, `--version`, text/JSON/NDJSON output,
`--output`, `--append`, custom messages and separators, and uppercase output.
`--help` lists every option. GitHub Actions integration uses `--github-output`
and `--github-summary`; these require their corresponding `GITHUB_OUTPUT` or
`GITHUB_STEP_SUMMARY` environment variable.

## Pull requests

- Keep changes focused and include tests for behavior changes.
- Preserve the lockfile when changing package metadata or dependencies.
- Use least-privilege permissions for workflow changes.
- Describe the change and how it was validated in the pull request.

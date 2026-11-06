# DevOps Pipeline

This repository contains a small Node.js command-line example and GitHub
Actions workflows for practicing continuous integration and delivery. The
example lives in [`Downloads/devops-pipelines-main`](Downloads/devops-pipelines-main)
and demonstrates repeatable CI validation, dependency auditing, and static
analysis.

The CLI can generate configurable text, JSON, or NDJSON messages and write
them to standard output, files, or GitHub Actions output and summary files.
See the [CLI guide](Downloads/devops-pipelines-main/README.md) for setup and
examples.

## Repository automation

- [CI workflow](.github/workflows/ci.yml): validates the example on Linux and
  Windows with supported Node.js releases, audits dependencies, and checks
  package contents.
- [CodeQL workflow](.github/workflows/codeql.yml): analyzes the JavaScript
  source.
- [Dependency review](.github/workflows/dependency-review.yml): reviews
  dependency changes in pull requests.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, CLI options,
configuration precedence, and pull request guidance.

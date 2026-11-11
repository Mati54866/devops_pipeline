const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { getMessages, main } = require('./index');

test('returns the DevOps greeting', () => {
  assert.deepEqual(getMessages(), [
    'Hello DevOps!',
    "I'm learning CI/CD using GitHub Actions"
  ]);
});

test('returns a fresh message list on each call', () => {
  const messages = getMessages();
  messages.pop();

  assert.equal(getMessages().length, 2);
});

test('personalizes the greeting when a name is provided', () => {
  assert.equal(getMessages('Ada')[0], 'Hello Ada!');
});

test('appends custom messages in the order supplied', () => {
  assert.deepEqual(getMessages('Ada', ['Build started', 'Deploy complete']), [
    'Hello Ada!',
    "I'm learning CI/CD using GitHub Actions",
    'Build started',
    'Deploy complete'
  ]);
});

test('accepts repeated custom message options', () => {
  const output = [];
  assert.equal(main(['--message', 'Build started', '--message=Deploy complete'], (message) => output.push(message)), 0);
  assert.deepEqual(output.slice(-2), ['Build started', 'Deploy complete']);
});

test('joins text output with a custom separator', () => {
  const output = [];
  assert.equal(main(['--separator', ' | '], (message) => output.push(message)), 0);
  assert.equal(output[0], getMessages().join(' | '));
});

test('converts output to uppercase when requested', () => {
  const output = [];
  assert.equal(main(['--uppercase'], (message) => output.push(message)), 0);
  assert.deepEqual(output, getMessages().map((message) => message.toUpperCase()));
});

test('--no-uppercase overrides environment casing', () => {
  const output = [];
  assert.equal(main(['--no-uppercase'], (message) => output.push(message), () => {}, {
    DEVOPS_UPPERCASE: 'true'
  }), 0);
  assert.deepEqual(output, getMessages());
});

test('uses the greeting name from the environment by default', () => {
  const output = [];
  assert.equal(main([], (message) => output.push(message), () => {}, {
    DEVOPS_GREETING_NAME: 'Grace'
  }), 0);
  assert.equal(output[0], 'Hello Grace!');
});

test('command-line name overrides the environment default', () => {
  const output = [];
  assert.equal(main(['--name', 'Ada'], (message) => output.push(message), () => {}, {
    DEVOPS_GREETING_NAME: 'Grace'
  }), 0);
  assert.equal(output[0], 'Hello Ada!');
});

test('environment name overrides the config default', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-env-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ name: 'Grace' }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath], (message) => output.push(message), () => {}, {
      DEVOPS_GREETING_NAME: 'Ada'
    }), 0);
    assert.equal(output[0], 'Hello Ada!');
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('DEVOPS_CONFIG selects the config file when no CLI config is provided', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-env-path-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ name: 'Grace' }), 'utf8');
    const output = [];
    assert.equal(main([], (message) => output.push(message), () => {}, {
      DEVOPS_CONFIG: configPath
    }), 0);
    assert.equal(output[0], 'Hello Grace!');
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('DEVOPS_FORMAT overrides the format from config', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-format-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ format: 'text' }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath], (message) => output.push(message), () => {}, {
      DEVOPS_FORMAT: 'json'
    }), 0);
    assert.deepEqual(JSON.parse(output[0]), getMessages());
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('DEVOPS_SEPARATOR overrides the configured text separator', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-separator-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ separator: ', ' }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath], (message) => output.push(message), () => {}, {
      DEVOPS_SEPARATOR: ' | '
    }), 0);
    assert.equal(output[0], getMessages().join(' | '));
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('DEVOPS_MESSAGES are appended between config and command-line messages', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-messages-order-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ messages: ['From config'] }), 'utf8');
    const output = [];
    assert.equal(main(
      ['--config', configPath, '--message', 'From CLI'],
      (message) => output.push(message),
      () => {},
      { DEVOPS_MESSAGES: '["From environment"]' }
    ), 0);
    assert.deepEqual(output.slice(2), ['From config', 'From environment', 'From CLI']);
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('rejects malformed DEVOPS_MESSAGES JSON', () => {
  const errors = [];
  assert.equal(main([], () => {}, (message) => errors.push(message), {
    DEVOPS_MESSAGES: '["unfinished"'
  }), 2);
  assert.match(errors[0], /DEVOPS_MESSAGES must be a JSON array/);
});

test('rejects unsupported DEVOPS_FORMAT values', () => {
  const errors = [];
  assert.equal(main([], () => {}, (message) => errors.push(message), {
    DEVOPS_FORMAT: 'yaml'
  }), 2);
  assert.match(errors[0], /DEVOPS_FORMAT must be/);
});

test('CLI output format overrides an invalid environment format', () => {
  const output = [];
  assert.equal(main(['--format', 'text'], (message) => output.push(message), () => {}, {
    DEVOPS_FORMAT: 'unsupported'
  }), 0);
  assert.deepEqual(output, getMessages());
});

test('DEVOPS_UPPERCASE overrides configured casing', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-uppercase-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ uppercase: true }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath], (message) => output.push(message), () => {}, {
      DEVOPS_UPPERCASE: 'false'
    }), 0);
    assert.deepEqual(output, getMessages());
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('rejects invalid DEVOPS_UPPERCASE values', () => {
  const errors = [];
  assert.equal(main([], () => {}, (message) => errors.push(message), {
    DEVOPS_UPPERCASE: 'sometimes'
  }), 2);
  assert.match(errors[0], /DEVOPS_UPPERCASE must be/);
});

test('CLI casing option overrides an invalid environment value', () => {
  const output = [];
  assert.equal(main(['--no-uppercase'], (message) => output.push(message), () => {}, {
    DEVOPS_UPPERCASE: 'sometimes'
  }), 0);
  assert.deepEqual(output, getMessages());
});

test('command-line config path overrides DEVOPS_CONFIG', () => {
  const envConfigPath = path.join(os.tmpdir(), `devops-config-env-${process.pid}.json`);
  const cliConfigPath = path.join(os.tmpdir(), `devops-config-cli-${process.pid}.json`);
  try {
    fs.writeFileSync(envConfigPath, JSON.stringify({ name: 'Grace' }), 'utf8');
    fs.writeFileSync(cliConfigPath, JSON.stringify({ name: 'Ada' }), 'utf8');
    const output = [];
    assert.equal(main(
      ['--config', cliConfigPath],
      (message) => output.push(message),
      () => {},
      { DEVOPS_CONFIG: envConfigPath }
    ), 0);
    assert.equal(output[0], 'Hello Ada!');
  } finally {
    fs.rmSync(envConfigPath, { force: true });
    fs.rmSync(cliConfigPath, { force: true });
  }
});

test('reads the name from standard input when requested', () => {
  const output = [];
  assert.equal(main(['--name', '-'], (message) => output.push(message), () => {}, {}, () => 'Ada\n'), 0);
  assert.equal(output[0], 'Hello Ada!');
});

test('exports messages using the GitHub Actions output file protocol', () => {
  const outputPath = path.join(os.tmpdir(), `devops-github-output-${process.pid}.txt`);
  try {
    assert.equal(main(['--github-output'], () => {}, () => {}, {
      GITHUB_OUTPUT: outputPath
    }), 0);
    const output = fs.readFileSync(outputPath, 'utf8');
    assert.match(output, /^messages<<DEVOPS_[a-f0-9]+\n/);
    assert.ok(output.includes(getMessages().join('\n')));
  } finally {
    fs.rmSync(outputPath, { force: true });
  }
});

test('preserves NDJSON format in GitHub Actions outputs', () => {
  const outputPath = path.join(os.tmpdir(), `devops-github-ndjson-${process.pid}.txt`);
  try {
    assert.equal(main(['--format=ndjson', '--github-output'], () => {}, () => {}, {
      GITHUB_OUTPUT: outputPath
    }), 0);
    const output = fs.readFileSync(outputPath, 'utf8');
    const value = output.split('\n').slice(1, -2);
    assert.deepEqual(value.map((line) => JSON.parse(line)), getMessages());
  } finally {
    fs.rmSync(outputPath, { force: true });
  }
});

test('requires GITHUB_OUTPUT for GitHub Actions output mode', () => {
  const errors = [];
  assert.equal(main(['--github-output'], () => {}, (message) => errors.push(message), {}), 2);
  assert.match(errors[0], /requires the GITHUB_OUTPUT/);
});

test('rejects conflicting output destinations', () => {
  const errors = [];
  assert.equal(main(
    ['--github-output', '--output', 'messages.txt'],
    () => {},
    (message) => errors.push(message),
    { GITHUB_OUTPUT: 'github-output.txt' }
  ), 2);
  assert.match(errors[0], /cannot be combined with --output/);

  errors.length = 0;
  assert.equal(main(
    ['--github-summary', '--append'],
    () => {},
    (message) => errors.push(message),
    { GITHUB_STEP_SUMMARY: 'summary.md' }
  ), 2);
  assert.match(errors[0], /cannot be combined with GitHub Actions/);
});

test('writes escaped messages to the GitHub Actions step summary', () => {
  const summaryPath = path.join(os.tmpdir(), `devops-summary-${process.pid}.md`);
  try {
    assert.equal(main(['--message', '<Deploy>'], () => {}, () => {}, {
      GITHUB_STEP_SUMMARY: summaryPath
    }), 0);
    const summary = fs.readFileSync(summaryPath, 'utf8');
    assert.match(summary, /^## DevOps pipeline messages/m);
    assert.ok(summary.includes('&lt;Deploy&gt;'));
    assert.ok(!summary.includes('<Deploy>'));
  } finally {
    fs.rmSync(summaryPath, { force: true });
  }
});

test('accepts a name from the command line', () => {
  const output = [];
  main(['--name', 'Ada'], (message) => output.push(message));

  assert.equal(output[0], 'Hello Ada!');
});

test('accepts an equals-form name option', () => {
  const output = [];
  main(['--name=Ada'], (message) => output.push(message));

  assert.equal(output[0], 'Hello Ada!');
});

test('supports short aliases for name, JSON, and help options', () => {
  const output = [];
  main(['-n', 'Ada', '-j'], (message) => output.push(message));
  assert.deepEqual(JSON.parse(output[0]), [
    'Hello Ada!',
    "I'm learning CI/CD using GitHub Actions"
  ]);

  output.length = 0;
  main(['-h'], (message) => output.push(message));
  assert.match(output[0], /^Usage:/);
});

test('prints messages as JSON when requested', () => {
  const output = [];
  main(['--json'], (message) => output.push(message));

  assert.deepEqual(JSON.parse(output[0]), getMessages());
});

test('writes formatted output to a file instead of stdout', () => {
  const outputPath = path.join(os.tmpdir(), `devops-output-${process.pid}.txt`);
  const output = [];
  try {
    assert.equal(main(['--output', outputPath], (message) => output.push(message)), 0);
    assert.deepEqual(output, []);
    assert.equal(fs.readFileSync(outputPath, 'utf8'), `${getMessages().join('\n')}\n`);
  } finally {
    fs.rmSync(outputPath, { force: true });
  }
});

test('loads validated defaults from a JSON config file', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({
      name: 'Grace',
      messages: ['Deployment ready'],
      format: 'text',
      uppercase: true
    }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath], (message) => output.push(message)), 0);
    assert.deepEqual(output, [
      'HELLO GRACE!',
      "I'M LEARNING CI/CD USING GITHUB ACTIONS",
      'DEPLOYMENT READY'
    ]);
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('trims whitespace around configured messages', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-trim-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ messages: ['  Deploy complete  '] }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath], (message) => output.push(message)), 0);
    assert.equal(output.at(-1), 'Deploy complete');
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('command-line options override config defaults', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-override-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ name: 'Grace' }), 'utf8');
    const output = [];
    assert.equal(main(['--config', configPath, '--name', 'Ada'], (message) => output.push(message)), 0);
    assert.equal(output[0], 'Hello Ada!');
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('rejects unknown config keys', () => {
  const configPath = path.join(os.tmpdir(), `devops-config-invalid-${process.pid}.json`);
  try {
    fs.writeFileSync(configPath, JSON.stringify({ unsupported: true }), 'utf8');
    const errors = [];
    assert.equal(main(['--config', configPath], () => {}, (message) => errors.push(message)), 2);
    assert.match(errors[0], /Unknown config option/);
  } finally {
    fs.rmSync(configPath, { force: true });
  }
});

test('rejects multiple config files as ambiguous', () => {
  const errors = [];
  assert.equal(main(
    ['--config', 'first.json', '--config=second.json'],
    () => {},
    (message) => errors.push(message)
  ), 2);
  assert.match(errors[0], /can only be provided once/);
});

test('reports output file write failures', () => {
  const errors = [];
  assert.equal(main(['--output', os.tmpdir()], () => {}, (message) => errors.push(message)), 1);
  assert.match(errors[0], /Unable to write output file/);
});

test('appends text output to an existing file', () => {
  const outputPath = path.join(os.tmpdir(), `devops-append-${process.pid}.txt`);
  try {
    fs.writeFileSync(outputPath, 'Previous run\n', 'utf8');
    assert.equal(main(['--output', outputPath, '--append'], () => {}), 0);
    assert.equal(
      fs.readFileSync(outputPath, 'utf8'),
      `Previous run\n${getMessages().join('\n')}\n`
    );
  } finally {
    fs.rmSync(outputPath, { force: true });
  }
});

test('rejects append without an output file', () => {
  const errors = [];
  assert.equal(main(['--append'], () => {}, (message) => errors.push(message)), 2);
  assert.match(errors[0], /requires --output/);
});

test('supports explicit text and JSON output formats', () => {
  const text = [];
  assert.equal(main(['--format=text'], (message) => text.push(message)), 0);
  assert.deepEqual(text, getMessages());

  const json = [];
  assert.equal(main(['--format', 'json'], (message) => json.push(message)), 0);
  assert.deepEqual(JSON.parse(json[0]), getMessages());
});

test('emits one JSON value per line in NDJSON format', () => {
  const output = [];
  assert.equal(main(['--format=ndjson'], (message) => output.push(message)), 0);
  assert.deepEqual(output.map((line) => JSON.parse(line)), getMessages());
});

test('rejects unsupported output formats', () => {
  const errors = [];
  assert.equal(main(['--format', 'xml'], () => {}, (message) => errors.push(message)), 2);
  assert.match(errors[0], /must be "text" or "json"/);
});

test('shows command usage when help is requested', () => {
  const output = [];
  assert.equal(main(['--help'], (message) => output.push(message)), 0);
  assert.match(output[0], /^Usage:/);
});

test('help and version work even when a config path is invalid', () => {
  const help = [];
  assert.equal(main(['--help', '--config', 'missing-config.json'], (message) => help.push(message)), 0);
  assert.match(help[0], /--github-summary/);

  const version = [];
  assert.equal(main(['--config', 'missing-config.json', '--version'], (message) => version.push(message)), 0);
  assert.match(version[0], /^\d+\.\d+\.\d+$/);
});

test('prints the package version when requested', () => {
  const output = [];
  assert.equal(main(['--version'], (message) => output.push(message)), 0);
  assert.match(output[0], /^\d+\.\d+\.\d+$/);
});

test('rejects unknown options with a non-zero status', () => {
  const errors = [];
  assert.equal(main(['--unknown'], () => {}, (message) => errors.push(message)), 2);
  assert.match(errors[0], /Unknown option/);
});

test('rejects a missing name value', () => {
  const errors = [];
  assert.equal(main(['--name'], () => {}, (message) => errors.push(message)), 2);
  assert.match(errors[0], /requires a non-empty value/);
});

test('trims names and rejects whitespace-only values', () => {
  const output = [];
  assert.equal(main(['--name', '  Ada  '], (message) => output.push(message)), 0);
  assert.equal(output[0], 'Hello Ada!');

  const errors = [];
  assert.equal(main(['--name=   '], () => {}, (message) => errors.push(message)), 2);
  assert.match(errors[0], /requires a non-empty value/);
});

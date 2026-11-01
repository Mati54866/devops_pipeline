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

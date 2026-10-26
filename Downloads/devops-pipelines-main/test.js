const assert = require('node:assert/strict');
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

test('supports explicit text and JSON output formats', () => {
  const text = [];
  assert.equal(main(['--format=text'], (message) => text.push(message)), 0);
  assert.deepEqual(text, getMessages());

  const json = [];
  assert.equal(main(['--format', 'json'], (message) => json.push(message)), 0);
  assert.deepEqual(JSON.parse(json[0]), getMessages());
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

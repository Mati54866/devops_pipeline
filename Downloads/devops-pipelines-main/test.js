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

test('accepts a name from the command line', () => {
  const output = [];
  main(['--name', 'Ada'], (message) => output.push(message));

  assert.equal(output[0], 'Hello Ada!');
});

test('prints messages as JSON when requested', () => {
  const output = [];
  main(['--json'], (message) => output.push(message));

  assert.deepEqual(JSON.parse(output[0]), getMessages());
});

test('shows command usage when help is requested', () => {
  const output = [];
  assert.equal(main(['--help'], (message) => output.push(message)), 0);
  assert.match(output[0], /^Usage:/);
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

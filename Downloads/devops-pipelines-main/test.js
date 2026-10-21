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

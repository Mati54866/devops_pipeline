function getMessages(name = 'DevOps') {
  return [
    `Hello ${name}!`,
    "I'm learning CI/CD using GitHub Actions"
  ];
}

function main(
  argv = process.argv.slice(2),
  write = console.log,
  writeError = console.error
) {
  let name = 'DevOps';
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--help') {
      write('Usage: npm start [--name <name>] [--json] [--help]');
      return 0;
    }

    if (argv[index] === '--json') {
      json = true;
      continue;
    }

    if (argv[index] === '--name') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        writeError('The --name option requires a non-empty value.');
        return 2;
      }
      name = value;
      index += 1;
      continue;
    }

    writeError(`Unknown option: ${argv[index]}`);
    return 2;
  }

  const messages = getMessages(name);
  if (json) {
    write(JSON.stringify(messages));
    return 0;
  }

  for (const message of messages) {
    write(message);
  }

  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { getMessages, main };

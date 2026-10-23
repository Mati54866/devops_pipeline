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
    if (argv[index] === '--help' || argv[index] === '-h') {
      write('Usage: npm start [--name|-n <name>] [--json|-j] [--help|-h]');
      return 0;
    }

    if (argv[index] === '--json' || argv[index] === '-j') {
      json = true;
      continue;
    }

    if (argv[index] === '--name' || argv[index] === '-n' || argv[index].startsWith('--name=')) {
      const value = argv[index] === '--name' || argv[index] === '-n'
        ? argv[index + 1]
        : argv[index].slice('--name='.length);
      if (!value || value.startsWith('--')) {
        writeError('The --name option requires a non-empty value.');
        return 2;
      }
      name = value;
      if (argv[index] === '--name' || argv[index] === '-n') {
        index += 1;
      }
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

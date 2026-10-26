const packageJson = require('./package.json');

function getMessages(name = 'DevOps') {
  return [
    `Hello ${name}!`,
    "I'm learning CI/CD using GitHub Actions"
  ];
}

function main(
  argv = process.argv.slice(2),
  write = console.log,
  writeError = console.error,
  env = process.env
) {
  let name = (env.DEVOPS_GREETING_NAME || '').trim() || 'DevOps';
  let format = 'text';

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--version' || argv[index] === '-v') {
      write(packageJson.version);
      return 0;
    }

    if (argv[index] === '--help' || argv[index] === '-h') {
      write('Usage: npm start [--name|-n <name>] [--format <text|json>] [--json|-j] [--help|-h] [--version|-v]\nSet DEVOPS_GREETING_NAME to configure the default name.');
      return 0;
    }

    if (argv[index] === '--json' || argv[index] === '-j') {
      format = 'json';
      continue;
    }

    if (argv[index] === '--format' || argv[index].startsWith('--format=')) {
      const value = argv[index] === '--format'
        ? argv[index + 1]
        : argv[index].slice('--format='.length);
      if (value !== 'text' && value !== 'json') {
        writeError('The --format option must be "text" or "json".');
        return 2;
      }
      format = value;
      if (argv[index] === '--format') {
        index += 1;
      }
      continue;
    }

    if (argv[index] === '--name' || argv[index] === '-n' || argv[index].startsWith('--name=')) {
      const value = argv[index] === '--name' || argv[index] === '-n'
        ? argv[index + 1]
        : argv[index].slice('--name='.length);
      const normalizedValue = value && value.trim();
      if (!normalizedValue || normalizedValue.startsWith('--')) {
        writeError('The --name option requires a non-empty value.');
        return 2;
      }
      name = normalizedValue;
      if (argv[index] === '--name' || argv[index] === '-n') {
        index += 1;
      }
      continue;
    }

    writeError(`Unknown option: ${argv[index]}`);
    return 2;
  }

  const messages = getMessages(name);
  if (format === 'json') {
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

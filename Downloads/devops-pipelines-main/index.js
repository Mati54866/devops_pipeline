const fs = require('node:fs');
const packageJson = require('./package.json');

function getMessages(name = 'DevOps', extraMessages = []) {
  return [
    `Hello ${name}!`,
    "I'm learning CI/CD using GitHub Actions",
    ...extraMessages
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
  let separator;
  let uppercase = false;
  let outputFile;
  let append = false;
  const extraMessages = [];

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

    if (argv[index] === '--output' || argv[index].startsWith('--output=')) {
      outputFile = argv[index] === '--output'
        ? argv[index + 1]
        : argv[index].slice('--output='.length);
      if (!outputFile || outputFile.startsWith('--')) {
        writeError('The --output option requires a file path.');
        return 2;
      }
      if (argv[index] === '--output') {
        index += 1;
      }
      continue;
    }

    if (argv[index] === '--append') {
      append = true;
      continue;
    }

    if (argv[index] === '--message' || argv[index].startsWith('--message=')) {
      const value = argv[index] === '--message'
        ? argv[index + 1]
        : argv[index].slice('--message='.length);
      const normalizedValue = value && value.trim();
      if (!normalizedValue || normalizedValue.startsWith('--')) {
        writeError('The --message option requires a non-empty value.');
        return 2;
      }
      extraMessages.push(normalizedValue);
      if (argv[index] === '--message') {
        index += 1;
      }
      continue;
    }

    if (argv[index] === '--separator' || argv[index].startsWith('--separator=')) {
      separator = argv[index] === '--separator'
        ? argv[index + 1]
        : argv[index].slice('--separator='.length);
      if (separator === undefined || separator.startsWith('--')) {
        writeError('The --separator option requires a value.');
        return 2;
      }
      if (argv[index] === '--separator') {
        index += 1;
      }
      continue;
    }

    if (argv[index] === '--uppercase') {
      uppercase = true;
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

  if (append && !outputFile) {
    writeError('The --append option requires --output.');
    return 2;
  }
  if (append && format === 'json') {
    writeError('The --append option requires text output.');
    return 2;
  }

  const messages = getMessages(name, extraMessages).map((message) => (
    uppercase ? message.toUpperCase() : message
  ));
  if (format === 'json') {
    const output = `${JSON.stringify(messages)}\n`;
    if (outputFile) {
      try {
        fs.writeFileSync(outputFile, output, 'utf8');
      } catch (error) {
        writeError(`Unable to write output file "${outputFile}": ${error.message}`);
        return 1;
      }
    } else {
      write(output.trimEnd());
    }
    return 0;
  }

  if (outputFile) {
    const output = separator === undefined
      ? messages.join('\n')
      : messages.join(separator);
    try {
      const writeOutput = append ? fs.appendFileSync : fs.writeFileSync;
      writeOutput(outputFile, `${output}\n`, 'utf8');
    } catch (error) {
      writeError(`Unable to write output file "${outputFile}": ${error.message}`);
      return 1;
    }
    return 0;
  }

  if (separator !== undefined) {
    write(messages.join(separator));
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

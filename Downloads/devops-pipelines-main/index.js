const crypto = require('node:crypto');
const fs = require('node:fs');
const packageJson = require('./package.json');
const HELP_TEXT = [
  'Usage: npm start [options]',
  '',
  '  -h, --help                 Show this help.',
  '  -v, --version              Show the package version.',
  '  --config <file>            Load JSON defaults for name, messages, format, separator, and uppercase.',
  '  -n, --name <name|->        Set the greeting name; use - to read it from standard input.',
  '  --message <text>           Add a message (repeatable).',
  '  --format <format>          Select text, json, or ndjson output.',
  '  -j, --json                 Shorthand for --format json.',
  '  --separator <text>         Join text output with a custom separator.',
  '  --uppercase                Convert output messages to uppercase.',
  '  --no-uppercase             Preserve message casing.',
  '  --output <file>            Write output to a file.',
  '  --append                   Append output instead of replacing the file.',
  '  --github-output            Write a messages output for GitHub Actions.',
  '  --github-summary           Append a summary to the GitHub Actions step summary.',
  '',
  'DEVOPS_GREETING_NAME sets the default name; command-line options take precedence.'
].join('\n');

function getMessages(name = 'DevOps', extraMessages = []) {
  return [
    `Hello ${name}!`,
    "I'm learning CI/CD using GitHub Actions",
    ...extraMessages
  ];
}

function escapeSummaryText(value) {
  return value
    .replace(/\r?\n/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_{}\[\]()#+.!|>~-])/g, '\\$1');
}

function needsAppendLineBreak(filePath) {
  let descriptor;
  try {
    descriptor = fs.openSync(filePath, 'r');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }

  try {
    const size = fs.fstatSync(descriptor).size;
    if (size === 0) {
      return false;
    }
    const lastByte = Buffer.alloc(1);
    fs.readSync(descriptor, lastByte, 0, 1, size - 1);
    return lastByte[0] !== 0x0a;
  } finally {
    fs.closeSync(descriptor);
  }
}

function main(
  argv = process.argv.slice(2),
  write = console.log,
  writeError = console.error,
  env = process.env,
  readInput = () => fs.readFileSync(0, 'utf8')
) {
  if (argv.includes('--version') || argv.includes('-v')) {
    write(packageJson.version);
    return 0;
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    write(HELP_TEXT);
    return 0;
  }

  let configPath = (env.DEVOPS_CONFIG || '').trim() || undefined;
  let configOptionSeen = false;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--config' || argv[index].startsWith('--config=')) {
      if (configOptionSeen) {
        writeError('The --config option can only be provided once.');
        return 2;
      }
      configOptionSeen = true;
      configPath = argv[index] === '--config'
        ? argv[index + 1]
        : argv[index].slice('--config='.length);
      if (!configPath || configPath.startsWith('--')) {
        writeError('The --config option requires a file path.');
        return 2;
      }
      if (argv[index] === '--config') {
        index += 1;
      }
    }
  }

  let config = {};
  if (configPath) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      writeError(`Unable to load config file "${configPath}": ${error.message}`);
      return 1;
    }
    if (!config || Array.isArray(config) || typeof config !== 'object') {
      writeError('The config file must contain a JSON object.');
      return 2;
    }
    const allowedKeys = new Set(['name', 'messages', 'format', 'separator', 'uppercase']);
    const unknownKeys = Object.keys(config).filter((key) => !allowedKeys.has(key));
    if (unknownKeys.length > 0) {
      writeError(`Unknown config option: ${unknownKeys[0]}`);
      return 2;
    }
    if (config.name !== undefined && (typeof config.name !== 'string' || !config.name.trim())) {
      writeError('Config option "name" must be a non-empty string.');
      return 2;
    }
    if (config.messages !== undefined && (
      !Array.isArray(config.messages)
      || config.messages.some((message) => typeof message !== 'string' || !message.trim())
    )) {
      writeError('Config option "messages" must be an array of non-empty strings.');
      return 2;
    }
    if (config.format !== undefined && !['text', 'json', 'ndjson'].includes(config.format)) {
      writeError('Config option "format" must be "text", "json", or "ndjson".');
      return 2;
    }
    if (config.separator !== undefined && typeof config.separator !== 'string') {
      writeError('Config option "separator" must be a string.');
      return 2;
    }
    if (config.uppercase !== undefined && typeof config.uppercase !== 'boolean') {
      writeError('Config option "uppercase" must be a boolean.');
      return 2;
    }
  }

  let name = (env.DEVOPS_GREETING_NAME || '').trim() || config.name?.trim() || 'DevOps';
  const envFormat = (env.DEVOPS_FORMAT || '').trim();
  const cliFormatProvided = argv.some((argument) => (
    argument === '--json'
    || argument === '-j'
    || argument === '--format'
    || argument.startsWith('--format=')
  ));
  if (
    envFormat
    && !['text', 'json', 'ndjson'].includes(envFormat)
    && !cliFormatProvided
  ) {
    writeError('DEVOPS_FORMAT must be "text", "json", or "ndjson".');
    return 2;
  }
  const envUppercase = (env.DEVOPS_UPPERCASE || '').trim().toLowerCase();
  const cliUppercaseProvided = argv.includes('--uppercase') || argv.includes('--no-uppercase');
  if (
    envUppercase
    && envUppercase !== 'true'
    && envUppercase !== 'false'
    && !cliUppercaseProvided
  ) {
    writeError('DEVOPS_UPPERCASE must be "true" or "false".');
    return 2;
  }
  let envMessages = [];
  if (env.DEVOPS_MESSAGES !== undefined) {
    try {
      envMessages = JSON.parse(env.DEVOPS_MESSAGES);
    } catch (error) {
      writeError(`DEVOPS_MESSAGES must be a JSON array: ${error.message}`);
      return 2;
    }
    if (!Array.isArray(envMessages) || envMessages.some(
      (message) => typeof message !== 'string' || !message.trim()
    )) {
      writeError('DEVOPS_MESSAGES must be a JSON array of non-empty strings.');
      return 2;
    }
    envMessages = envMessages.map((message) => message.trim());
  }
  let format = ['text', 'json', 'ndjson'].includes(envFormat)
    ? envFormat
    : config.format || 'text';
  let separator = env.DEVOPS_SEPARATOR !== undefined
    ? env.DEVOPS_SEPARATOR
    : config.separator;
  let uppercase = envUppercase === 'true' || envUppercase === 'false'
    ? envUppercase === 'true'
    : config.uppercase || false;
  let outputFile = (env.DEVOPS_OUTPUT || '').trim() || undefined;
  let append = false;
  let githubOutput = false;
  let githubSummary = false;
  const extraMessages = [];

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--config') {
      index += 1;
      continue;
    }
    if (argv[index].startsWith('--config=')) {
      continue;
    }

    if (argv[index] === '--json' || argv[index] === '-j') {
      format = 'json';
      continue;
    }

    if (argv[index] === '--format' || argv[index].startsWith('--format=')) {
      const value = argv[index] === '--format'
        ? argv[index + 1]
        : argv[index].slice('--format='.length);
      if (value !== 'text' && value !== 'json' && value !== 'ndjson') {
        writeError('The --format option must be "text", "json", or "ndjson".');
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

    if (argv[index] === '--github-output') {
      githubOutput = true;
      continue;
    }

    if (argv[index] === '--github-summary') {
      githubSummary = true;
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

    if (argv[index] === '--no-uppercase') {
      uppercase = false;
      continue;
    }

    if (argv[index] === '--name' || argv[index] === '-n' || argv[index].startsWith('--name=')) {
      const value = argv[index] === '--name' || argv[index] === '-n'
        ? argv[index + 1]
        : argv[index].slice('--name='.length);
      let normalizedValue;
      if (value === '-') {
        try {
          normalizedValue = readInput().trim();
        } catch (error) {
          writeError(`Unable to read the name from standard input: ${error.message}`);
          return 1;
        }
      } else {
        normalizedValue = value && value.trim();
      }
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

  if ((githubOutput || githubSummary) && outputFile) {
    writeError('GitHub Actions output options cannot be combined with --output.');
    return 2;
  }
  if ((githubOutput || githubSummary) && append) {
    writeError('The --append option cannot be combined with GitHub Actions output options.');
    return 2;
  }
  if (append && !outputFile) {
    writeError('The --append option requires --output.');
    return 2;
  }
  if (append && format === 'json') {
    writeError('The --append option requires text or ndjson output.');
    return 2;
  }
  if (separator !== undefined && format !== 'text') {
    writeError('The --separator option is only available with text output.');
    return 2;
  }

  const configuredMessages = (config.messages || []).map((message) => message.trim());
  const messages = getMessages(name, [
    ...configuredMessages,
    ...envMessages,
    ...extraMessages
  ]).map((message) => (
    uppercase ? message.toUpperCase() : message
  ));
  if (githubOutput || githubSummary) {
    if (githubOutput && !env.GITHUB_OUTPUT) {
      writeError('The --github-output option requires the GITHUB_OUTPUT environment variable.');
      return 2;
    }
    if (githubSummary && !env.GITHUB_STEP_SUMMARY) {
      writeError('The --github-summary option requires the GITHUB_STEP_SUMMARY environment variable.');
      return 2;
    }

    if (githubOutput) {
      const delimiter = `DEVOPS_${crypto.randomBytes(16).toString('hex')}`;
      const value = format === 'json'
        ? JSON.stringify(messages)
        : format === 'ndjson'
          ? messages.map((message) => JSON.stringify(message)).join('\n')
          : messages.join(separator === undefined ? '\n' : separator);
      try {
        fs.appendFileSync(
          env.GITHUB_OUTPUT,
          `messages<<${delimiter}\n${value}\n${delimiter}\n`,
          'utf8'
        );
      } catch (error) {
        writeError(`Unable to write GitHub Actions output: ${error.message}`);
        return 1;
      }
    }

    if (githubSummary) {
      const summary = [
        '## DevOps pipeline messages',
        '',
        ...messages.map((message) => `- ${escapeSummaryText(message)}`),
        ''
      ].join('\n');
      try {
        fs.appendFileSync(env.GITHUB_STEP_SUMMARY, summary, 'utf8');
      } catch (error) {
        writeError(`Unable to write GitHub Actions summary: ${error.message}`);
        return 1;
      }
    }

    return 0;
  }

  if (format === 'json' || format === 'ndjson') {
    const output = format === 'json'
      ? `${JSON.stringify(messages)}\n`
      : `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`;
    if (outputFile) {
      try {
        const writeOutput = append ? fs.appendFileSync : fs.writeFileSync;
        writeOutput(outputFile, output, 'utf8');
      } catch (error) {
        writeError(`Unable to write output file "${outputFile}": ${error.message}`);
        return 1;
      }
    } else {
      for (const line of output.trimEnd().split('\n')) {
        write(line);
      }
    }
    return 0;
  }

  if (outputFile) {
    const output = separator === undefined
      ? messages.join('\n')
      : messages.join(separator);
    try {
      const writeOutput = append ? fs.appendFileSync : fs.writeFileSync;
      const lineBreak = append && needsAppendLineBreak(outputFile) ? '\n' : '';
      writeOutput(outputFile, `${lineBreak}${output}\n`, 'utf8');
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

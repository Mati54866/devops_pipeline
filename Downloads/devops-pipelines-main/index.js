function getMessages(name = 'DevOps') {
  return [
    `Hello ${name}!`,
    "I'm learning CI/CD using GitHub Actions"
  ];
}

function main(argv = process.argv.slice(2), write = console.log) {
  const nameIndex = argv.indexOf('--name');
  const name = nameIndex === -1 ? 'DevOps' : argv[nameIndex + 1];

  for (const message of getMessages(name)) {
    write(message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getMessages, main };

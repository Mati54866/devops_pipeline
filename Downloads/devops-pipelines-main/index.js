function getMessages(name = 'DevOps') {
  return [
    `Hello ${name}!`,
    "I'm learning CI/CD using GitHub Actions"
  ];
}

function main() {
  for (const message of getMessages()) {
    console.log(message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getMessages };

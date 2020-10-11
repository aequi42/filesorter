const chalk = require("chalk");
const { mainMenu } = require("./prompts");
const commands = require("./commands");
const { toPairs } = require("lodash");

async function main() {
  console.log(chalk.green`╔════════════════════╗`);
  console.log(chalk.green`║                    ║`);
  console.log(chalk.green`║ File System Sorter ║`);
  console.log(chalk.green`║                    ║`);
  console.log(chalk.green`╚════════════════════╝`);

  const possibleCommands = toPairs(commands).map((cmd) => ({
    name: cmd[1].description,
    value: cmd[0],
  }));

  do {
    let { selection } = await mainMenu(possibleCommands);
    await commands[selection].action();
  } while (true);
}

main().then(console.log).catch(console.error);

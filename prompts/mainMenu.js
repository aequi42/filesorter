const chalk = require('chalk')
const { format } = require('date-fns')
const inquirer = require('inquirer')
const path = require('path')

function mainMenu(commands) {
  return inquirer.prompt([
    {
      name: 'selection',
      type: 'list',
      message: 'What would you like to do?',
      choices: commands,
    },
  ])
}

module.exports = mainMenu

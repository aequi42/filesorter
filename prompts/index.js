/**
 * @typedef SettingsResponse
 * @property {string} pathToDir The path to the directory which should be scaned
 * @property {string[]} filter The fileextensions which should be included
 * @property {string} targetPath The target
 * @property {string} dateFormat The format of the grouping date
 * @property {boolean} confirm Indicates if the values are correct
 * @property {"debug"|"copy"|"move"} mode The mode
 *  */

const chalk = require('chalk')
const { format } = require('date-fns')
const inquirer = require('inquirer')
const path = require('path')
const { mainMenu } = require('./mainMenu')

/**
 * Displays a prompt for basic fileselection and grouping settings
 * @returns {Promise<SettingsResponse>}
 */
function fileSelectionSettingPrompt() {
  return inquirer.prompt([
    {
      type: 'input',
      message: 'Path to Folder',
      name: 'pathToDir',
      filter: (pathToDir) => path.normalize(pathToDir),
    },
    {
      type: 'input',
      message: `Which file types should be respected? ${chalk.gray`(Comma seperated)`}`,
      name: 'filter',
      default: '.jpg, .mp4',
      filter: (answer) => answer.split(',').map((s) => s.trim()),
    },
    {
      type: 'input',
      message: 'Path to new Folder',
      default: ({ pathToDir }) => pathToDir,
      filter: (answer, { pathToDir }) => answer || pathToDir,
      name: 'targetPath',
    },
    {
      type: 'list',
      message: 'At which resolution should the files be grouped?',
      name: 'dateFormat',
      choices: () => [
        {
          name: `Year\t ${chalk.gray(format(new Date(), 'yyyy', new Date()))}`,
          value: 'yyyy',
          short: 'Year',
        },
        {
          name: `Month\t ${chalk.gray(format(new Date(), 'yyyy-MM', new Date()))}`,
          value: 'yyyy-MM',
          short: 'Month',
        },
        {
          name: `Day\t ${chalk.gray(format(new Date(), 'yyyy-MM-dd', new Date()))}`,
          value: 'yyyy-MM-dd',
          short: 'Day',
        },
      ],
    },
    {
      type: 'list',
      name: 'mode',
      message: 'Which mode should be used?',
      choices: [
        {
          name: `Debug ${chalk.gray`(Only display the operations, don't execute them)`}`,
          value: 'debug',
        },
        {
          name: `Copy to new location`,
          value: 'copy',
        },
        {
          name: `Move to new location`,
          value: 'move',
        },
      ],
    },
    {
      type: 'confirm',
      message: ({ pathToDir, filter, dateFormat }) =>
        `Scan all files from ${chalk.yellow(path.normalize(pathToDir))}, filtered by ${chalk.yellow(
          filter
        )} and group them like ${chalk.yellow(format(new Date(), dateFormat, new Date()))}?`,
      name: 'confirm',
    },
  ])
}

module.exports = {
  fileSelectionSettingPrompt,
  mainMenu: require('./mainMenu'),
}

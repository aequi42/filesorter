const inquirer = require('inquirer')
const chalk = require('chalk')
const path = require('path')
const _ = require('lodash')
const { loadFiles, copyFiles } = require('../fileOps')
const { fileSelectionSettingPrompt } = require('../prompts')
const { format, parse } = require('date-fns')

async function copyFilesAction() {
  let answers

  do {
    answers = await fileSelectionSettingPrompt()
  } while (!answers.confirm)
  const { pathToDir, filter, targetPath, dateFormat, mode } = answers
  const files = await loadFiles(path.normalize(pathToDir), filter)
  const withGroupKey = addGroupKey(dateFormat, files)
  const grouped = groupFiles(withGroupKey)

  var { confirmCopy } = await inquirer.prompt([
    {
      type: 'confirm',
      message: `${mode === 'move' ? 'Move' : 'Copy'} ${chalk.blue(withGroupKey.length)} files into ${chalk.blue(
        grouped.length
      )} groups inside ${chalk.yellow(targetPath)}?`,
      name: 'confirmCopy',
    },
  ])
  if (confirmCopy) {
    await copyFiles(grouped, targetPath, mode)
  }
}

/**
 * Groups a collection by its first tuple value
 * @param {[string, string][]} filesWithDates Array of all filesnames
 * @returns { [string, string[]][]}
 */
function groupFiles(filesWithDates) {
  const groupedByDay = filesWithDates.reduce((agg, curr, idx) => {
    const date = curr[0]
    const val = curr[1]
    const existingGroup = agg.find((a) => a[0] === date)

    if (existingGroup) {
      // console.log(`found ${date}`);
      existingGroup[1].push(val)
    } else {
      // console.log(`not found ${date}`);
      agg.push([date, [val]])
    }
    return agg
  }, [])

  return groupedByDay
}

/**
 * Creates a tuple for each filename `[[formatted Date, filename]]`
 * @param {string} dateFormat The format which should be used as the Group Key
 * @param {string[]} files The filenames
 * @returns {[string, string][]} A tuple of grouping key and filename
 */
function addGroupKey(dateFormat, files) {
  const parseDate = (filename) => {
    const baseName = path.basename(filename)
    const withoutExt = baseName.substr(0, 15)
    return parse(withoutExt, 'yyyyMMdd_HHmmss', new Date())
  }
  const formatedDateFromFilename = (filename) => {
    var date = parseDate(filename)
    return format(date, dateFormat)
  }
  return files.map((f) => [formatedDateFromFilename(f), f])
}

module.exports = copyFilesAction

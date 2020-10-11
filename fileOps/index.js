const chalk = require('chalk')
const inquirer = require('inquirer')
const ora = require('ora')
const { promises: fs, constants: fsconstants } = require('fs')
const path = require('path')

/**
 * Reads the files of the passed path
 * @param {string} pathToDir Path to directory to scan
 * @param {string[]} filter Fileextensions to filter for
 */
async function loadFiles(pathToDir, filter) {
  const loader = ora('Loading Files')
  loader.start()
  const files = await fs.readdir(pathToDir)
  const onlyMediaFiles = files.filter((f) => filter.indexOf(path.extname(f)) >= 0)
  loader.stop()
  return onlyMediaFiles.map((f) => path.join(pathToDir, f))
}

async function copyFiles(grouped, target, mode) {
  const copySpinner = ora('Copy Files')
  copySpinner.start()
  let allFiles = 0
  let copied = 0
  const failed = []

  try {
    await fs.access(target)
  } catch (e) {
    if (mode === 'debug') console.log(`Create Directory ${target}`)
    else await fs.mkdir(target, { recursive: true })
  }

  await Promise.all(
    grouped.map(async ([time, files]) => {
      var dirPath = path.normalize(path.join(target, time))
      try {
        await fs.access(dirPath)
      } catch (e) {
        if (mode === 'debug') console.log(`Create Directory ${dirPath}`)
        else await fs.mkdir(dirPath, { recursive: true })
      }
      return await Promise.all(
        files.map(async (f) => {
          allFiles += 1
          const filename = path.basename(f)
          const oldFilePath = path.normalize(f)
          const newFilePath = path.normalize(path.join(dirPath, filename))
          if (mode === 'debug')
            console.log(`${mode === 'copy' ? 'Copy' : 'Move'} File: ${oldFilePath} -> ${newFilePath}`)
          else {
            try {
              if (mode === 'copy') await fs.copyFile(oldFilePath, newFilePath, fsconstants.COPYFILE_FICLONE)
              else if (mode === 'move') await fs.rename(oldFilePath, newFilePath)
              copied += 1
              copySpinner.text = `${mode === 'copy' ? 'Copied' : 'Moved'} Files ${chalk.red(time)} ${chalk.green(
                filename
              )} ${chalk.yellow`${copied}/${allFiles}`}`
            } catch (error) {
              // console.error(error);
              failed.push(error)
            }
          }
        })
      )
    })
  )
  copySpinner.stop()
  if (failed.length) {
    let { showAllErrors } = await inquirer.prompt([
      {
        type: 'confirm',
        message: chalk.red`${failed.length} files couldn't be ${mode === 'copy' ? 'copied' : 'moved'}! Show all?`,
        name: 'showAllErrors',
      },
    ])
    if (showAllErrors) {
      failed.forEach((f) => console.log(f))
    }
  }
}
module.exports = {
  loadFiles,
  copyFiles,
}

const fs = require("fs").promises;
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const path = require("path");
const _ = require("lodash");
const { loadFiles, copyFiles } = require("./fileOps");
const { fileSelectionSettingPrompt } = require("./inputs");
const { format, parse } = require("date-fns");

// inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

async function main() {
  console.log(chalk.green`File System Sorter`);
  let answers;
  do {
    answers = await fileSelectionSettingPrompt();
  } while (!answers.confirm);
  const { pathToDir, filter, targetPath, dateFormat, mode } = answers;
  const files = await loadFiles(path.normalize(pathToDir), filter);
  const withGroupKey = addGroupKey(dateFormat, files);
  const grouped = groupFiles(withGroupKey);
  console.log(
    `Found ${chalk.blue(withGroupKey.length)} files in ${chalk.blue(
      grouped.length
    )} groups`
  );
  var { confirmCopy } = await inquirer.prompt([
    {
      type: "confirm",
      message: `Copy all files into hierarchy in ${chalk.yellow(targetPath)}`,
      name: "confirmCopy",
    },
  ]);
  if (confirmCopy) {
    await copyFiles(grouped, targetPath, mode);
  }
  return 0;
}

/**
 * Creates a tuple for each filename `[[formatted Date, filename]]`
 * @param {string} dateFormat The format which should be used as the Group Key
 * @param {string[]} files The filenames
 * @returns {[string, string][]} A tuple of grouping key and filename
 */
function addGroupKey(dateFormat, files) {
  const parseDate = (filename) => {
    const baseName = path.basename(filename);
    const withoutExt = baseName.substr(0, 15);
    return parse(withoutExt, "yyyyMMdd_HHmmss", new Date());
  };
  const formatedDateFromFilename = (filename) => {
    var date = parseDate(filename);
    return format(date, dateFormat);
  };
  return files.map((f) => [formatedDateFromFilename(f), f]);
}

/**
 * Groups a collection by its first tuple value
 * @param {[string, string][]} filesWithDates Array of all filesnames
 * @returns { [string, string[]][]}
 */
function groupFiles(filesWithDates) {
  const groupedByDay = filesWithDates.reduce((agg, curr, idx) => {
    const date = curr[0];
    const val = curr[1];
    const existingGroup = agg.find((a) => a[0] === date);

    if (existingGroup) {
      // console.log(`found ${date}`);
      existingGroup[1].push(val);
    } else {
      // console.log(`not found ${date}`);
      agg.push([date, [val]]);
    }
    return agg;
  }, []);

  return groupedByDay;
}
main().then(console.log).catch(console.error);

const fs = require("fs").promises;
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const path = require("path");
const _ = require("lodash");
// inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

async function main() {
  console.log(chalk.green`File System Sorter`);
  var { pathToDir, confirm } = await inquirer.prompt([
    {
      type: "input",
      message: "Path to Folder",
      name: "pathToDir",
    },
    {
      type: "confirm",
      message: ({ pathToDir }) => `Is ${chalk.yellow(pathToDir)} correct?`,
      name: "confirm",
    },
  ]);
  if (!confirm) {
    return 1;
  }
  const withDates = await loadFiles(pathToDir);
  const grouped = groupFiles(withDates);
  console.log(
    `found ${chalk.red(withDates.length)} files in ${chalk.red(
      grouped.length
    )} groups`
  );
  var { targetPath, confirmCopy, debugMode } = await inquirer.prompt([
    {
      type: "input",
      message: "Path to new Folder",
      default: pathToDir,
      name: "targetPath",
    },
    {
      type: "confirm",
      message: ({ targetPath }) =>
        `Copy all files into hierarchy in ${chalk.yellow(targetPath)}`,
      name: "confirmCopy",
    },
    {
      type: "confirm",
      message: "Use DebugMode? (doesn't copy the files)",
      name: "debugMode",
    },
  ]);
  if (confirmCopy) {
    await copyFiles(grouped, targetPath, debugMode);
  }
  return 0;
}

async function copyFiles(grouped, target, debugMode) {
  const copySpinner = ora("Copy Files");
  copySpinner.start();
  let allFiles = 0;
  let copied = 0;
  const failed = [];
  await Promise.all(
    grouped.map(async ([time, files]) => {
      var dirPath = path.normalize(path.join(target, time));
      try {
        await fs.access(dirPath);
      } catch (e) {
        if (debugMode) console.log(`create Directory ${dirPath}`);
        else fs.mkdir(dirPath, { recursive: true });
      }
      await Promise.all(
        files.map(async (f) => {
          allFiles += 1;
          const filename = path.basename(f);
          const oldFilePath = path.normalize(f);
          const newFilePath = path.normalize(path.join(dirPath, filename));
          copySpinner.text = `Copy Files ${chalk.red(time)} ${chalk.magenta(
            filename
          )}`;
          if (debugMode)
            console.log(`copy File: ${oldFilePath} -> ${newFilePath}`);
          else {
            try {
              await fs.copyFile(oldFilePath, newFilePath);
              copied += 1;
              copySpinner.text = `Copy Files ${chalk.red(time)} ${chalk.green(
                filename
              )} ${chalk.yellow`${copied}/${allFiles}`}`;
            } catch (error) {
              // console.error(error);
              failed.push(error);
            }
          }
        })
      );
    })
  );
  copySpinner.stop();
  if (failed.length) {
    let { showAllErrors } = await inquirer.prompt([
      {
        type: "confirm",
        message: chalk.red`${failed.length} files couldn't be copied! Show all?`,
        name: "showAllErros",
      },
    ]);
    if (showAllErrors) failed.forEach((f) => console.error(f));
  }
}

async function loadFiles(pathToDir) {
  const loader = ora("Loading Files");
  loader.start();
  const files = await fs.readdir(pathToDir);
  const onlyMediaFiles = files.filter(
    (f) => [".jpg", ".mp4"].indexOf(path.extname(f)) >= 0
  );

  const withDates = await Promise.all(
    onlyMediaFiles.map(async (f) => {
      const filePath = path.join(pathToDir, f);
      const file = await fs.stat(filePath);
      return [file.mtime, filePath];
    })
  );
  loader.stop();
  return withDates;
}

function getDateFromFilename(filename) {
  const baseName = path.basename(filename);
  const datePart = baseName.substr(0, 8);
  const year = datePart.substr(0, 4);
  const month = datePart.substr(4, 2);
  const day = datePart.substr(6, 2);
  return `${year}-${month}-${day}`;
}

function groupFiles(filesWithDates) {
  const groupedByDay = filesWithDates.reduce((agg, curr, idx) => {
    const fileDate = `${curr[0].getFullYear()}-${
      curr[0].getMonth() + 1 <= 9
        ? `0` + (curr[0].getMonth() + 1)
        : curr[0].getMonth() + 1
    }-${curr[0].getDate() <= 9 ? "0" + curr[0].getDate() : curr[0].getDate()}`;

    const date = getDateFromFilename(curr[1]);
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

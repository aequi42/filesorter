const copyFilesAction = require("./copyFilesAction");

const copyFiles = {
  description: "Copy/Move files",
  action: copyFilesAction,
};

const exitProgram = {
  description: "Exit the Program",
  action: async () => process.exit(0),
};

module.exports = {
  copyFiles,
  exitProgram,
};

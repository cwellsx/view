const path = require("path");
const fs = require("fs");

module.exports = function override(config, env) {
  // https://github.com/facebook/create-react-app/blob/a88a4c3af6b6b8557845f147604a098d2857a91a/packages/react-scripts/config/webpack.config.js#L356-L404
  const tsConfig = config.module.rules[2].oneOf[1];

  // apparently it works alright if you just add the whole packages dir
  // but if that didn't work you might like to specify specific subdirectories of packages

  const srcDir = path.resolve(__dirname, "./src");
  const clientDir = path.resolve(__dirname, "../client/src");
  const sharedLibDir = path.resolve(__dirname, "../shared-lib/src");
  const serverMockDir = path.resolve(__dirname, "../server-mock/src");
  const serverDir = path.resolve(__dirname, "../server/src");
  const serverTypesDir = path.resolve(__dirname, "../server-types/src");
  const serverDataDir1 = path.resolve(__dirname, "../server-data/src");
  const serverDataDir2 = path.resolve(__dirname, "../server-data/json");

  const packagesDir = path.resolve(__dirname, "..");
  const packageDirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && path.basename(__dirname) !== dirent.name)
    .map((dirent) => path.join(packagesDir, dirent.name))
    .map((dir) => (fs.existsSync(path.join(dir, "src")) ? path.join(dir, "src") : dir));

  tsConfig.include = [
    srcDir,
    clientDir,
    sharedLibDir,
    serverMockDir,
    serverDir,
    serverTypesDir,
    serverDataDir1,
    serverDataDir2,
  ];
  // tsConfig.include = [srcDir, ...packageDirs];
  tsConfig.include = [srcDir, packagesDir];
  // console.log(tsConfig.include);

  return config;
};

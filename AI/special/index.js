const fs = require("fs");
const path = require("path");

function loadSpecialAlgorithms() {
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter(function (f) {
      return f.endsWith(".js") && f !== "index.js";
    });

  const allModules = files.map(function (file) {
    var module = require(path.join(dir, file));
    return Object.keys(module)
      .map(function (key) {
        return module[key];
      })
      .filter(function (fn) {
        return typeof fn === "function";
      });
  });

  return [].concat.apply([], allModules);
}

module.exports = {
  loadSpecialAlgorithms: loadSpecialAlgorithms
};
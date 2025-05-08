const fs = require("fs");
const path = require("path");

function loadSpecialAlgorithms() {
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".js") && f !== "index.js");

  const allModules = files.map(file => {
    const module = require(path.join(dir, file));
    return Object.values(module).filter(fn => typeof fn === "function");
  });
  
  return Promise.resolve(allModules.flat());
}

module.exports = {
  loadSpecialAlgorithms
};
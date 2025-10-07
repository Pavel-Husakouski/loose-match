module.exports = {
  "delay": false,
  "package": "./package.json",
  "require": ["ts-node/esm", "test/bootstrap"],
  "ui": "bdd",
  "spec": "test/**/*.spec.ts",
  "extension": ["ts"],
  "node-option": ["no-deprecation"]
}

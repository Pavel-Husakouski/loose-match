module.exports = {
  delay: false,
  package: './package.json',
  require: ['ts-node/esm', 'test/bootstrap/index.ts'],
  ui: 'bdd',
  spec: 'test/**/*.spec.ts',
  extension: ['ts'],
  'node-option': ['experimental-specifier-resolution=node', 'import=./register-ts-node.mjs', 'no-deprecation'],
};

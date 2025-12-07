module.exports = {
  delay: false,
  package: './package.json',
  require: ['test/bootstrap/index.ts'],
  ui: 'bdd',
  spec: 'test/**/*.spec.ts',
  extension: ['ts'],
  'node-option': ['import=tsx'],
};

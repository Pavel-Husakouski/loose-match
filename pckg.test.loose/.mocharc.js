module.exports = {
  delay: false,
  package: './package.json',
  require: ['test/bootstrap'],
  ui: 'bdd',
  spec: 'test/**/*.spec.ts',
  extension: ['ts'],
  'node-option': ['import=tsx'],
};

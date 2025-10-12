export default {
  delay: false,
  package: './package.json',
  require: ['test/bootstrap'],
  ui: 'bdd',
  spec: 'test/**/*.spec.js',
  extension: ['js'],
  'node-option': ['no-deprecation'],
};

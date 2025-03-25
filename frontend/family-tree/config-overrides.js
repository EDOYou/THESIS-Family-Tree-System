const { override, babelInclude, addBabelPlugin } = require('customize-cra');
const path = require('path');

module.exports = override(
  babelInclude([
    path.resolve('src'), // Include your source files
    path.resolve('node_modules/family-chart'), // Include family-chart for transpilation
  ]),
  addBabelPlugin('@babel/plugin-proposal-optional-chaining'),
  addBabelPlugin('@babel/plugin-proposal-nullish-coalescing-operator')
);
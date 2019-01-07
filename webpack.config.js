const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/rate_it.js',
  output: {
    // This copies each source entry into the extension dist folder named
    // after its entry config key.
    path: path.join(path.resolve(__dirname), 'extension', 'dist'),
    filename: '[name].js',
  },
  resolve: {
    // This allows you to import modules just like you would in a NodeJS app.
    extensions: ['.js', '.jsx'],
    modules: [
      'src'
    ],
  },
  // This will expose source map files so that errors will point to your
  // original source files instead of the transpiled files.
  devtool: 'sourcemap',
};

const webpack = require('webpack');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const path = require('path');
const VENDOR_MANIFEST = require('graylog-web-manifests/vendor-manifest.json');
const TARGET = process.env.npm_lifecycle_event;

const defaultRootPath = path.resolve(module.parent.parent.filename, '../');
const defaultOptions = {
  root_path: defaultRootPath,
  entry_path: path.resolve(defaultRootPath, 'src/web/index.jsx'),
  build_path: path.resolve(defaultRootPath, 'build'),
};

function getPluginFullName(fqcn) {
  return `plugin.${fqcn}`;
}

function PluginWebpackConfig(fqcn, _options, additionalConfig) {
  const options = merge(defaultOptions, _options);
  const moduleJsonTemplate = path.resolve(module.parent.filename, '../templates/module.json.template');
  const config = {
    entry: {
    },
    output: {
      path: options.build_path,
      filename: '[name].[hash].js',
      publicPath: '',
    },
    module: {
      loaders: [
        { test: /\.(woff(2)?|svg|eot|ttf|gif|jpg)(\?.+)?$/, loader: 'file-loader' },
        { test: /\.png$/, loader: 'url-loader' },
        { test: /\.less$/, loaders: ['style', 'css', 'less'] },
        { test: /\.css$/, loaders: ['style', 'css'] },
        { test: /\.json$/, loader: 'json-loader' },
        { test: /\.ts$/, loader: 'babel-loader!ts-loader', exclude: /node_modules|\.node_cache/ },
        { test: /\.js(x)?$/, loader: 'babel-loader', exclude: /node_modules|\.node_cache/ },
      ],
    },
    devtool: 'source-map',
    plugins: [
      new HtmlWebpackPlugin({ filename: `${getPluginFullName(fqcn)}.module.json`, template: moduleJsonTemplate }),
      new webpack.DllReferencePlugin({ manifest: VENDOR_MANIFEST, context: options.root_path }),
      new webpack.DllReferencePlugin({ manifest: VENDOR_MANIFEST, context: options.web_src_path }),
      new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        sourceMap: true,
        compress: {
          warnings: false,
        },
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
    ],
    resolve: {
      root: [path.resolve(options.web_src_path, 'src')],
      extensions: ['', '.js', '.json', '.jsx', '.ts'],
      modulesDirectories: ['src/web', 'node_modules', 'src'],
    },
  };

  config.entry[getPluginFullName(fqcn)] = options.entry_path;

  if (TARGET === 'build') {
    config.plugins.push(new WebpackCleanupPlugin({}));
  }

  if (additionalConfig) {
    return merge.smart(config, additionalConfig);
  }

  return config;
}

module.exports = PluginWebpackConfig;

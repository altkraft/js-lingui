"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultConfig = undefined;

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

exports.replaceRootDir = replaceRootDir;
exports.getConfig = getConfig;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require("path");
var fs = require("fs");
var chalk = require("chalk");
var cosmiconfig = require("cosmiconfig");

var _require = require("jest-validate"),
    validate = _require.validate;

var _require2 = require("jest-regex-util"),
    replacePathSepForRegex = _require2.replacePathSepForRegex;

var NODE_MODULES = replacePathSepForRegex(path.sep + "node_modules" + path.sep);

function replaceRootDir(conf, rootDir) {
  var replace = function replace(s) {
    return s.replace("<rootDir>", rootDir);
  };["srcPathDirs", "srcPathIgnorePatterns", "localeDir"].forEach(function (key) {
    var value = conf[key];

    if (!value) {} else if (typeof value === "string") {
      conf[key] = replace(value);
    } else if (value.length) {
      conf[key] = value.map(replace);
    }
  });

  conf.rootDir = rootDir;
  return conf;
}

var defaultConfig = exports.defaultConfig = {
  localeDir: "./locale",
  sourceLocale: "",
  fallbackLocale: "",
  pseudoLocale: "",
  srcPathDirs: ["<rootDir>"],
  srcPathIgnorePatterns: [NODE_MODULES],
  sorting: "messageId",
  format: "lingui",
  formatOptions: {
    origins: true
  },
  rootDir: ".",
  extractBabelOptions: {
    plugins: [],
    presets: []
  },
  compileNamespace: "cjs"
};

var exampleConfig = (0, _extends3.default)({}, defaultConfig, {
  extractBabelOptions: {
    extends: "babelconfig.js",
    rootMode: "rootmode",
    plugins: ["plugin"],
    presets: ["preset"]
  }
});

var deprecatedConfig = {
  fallbackLanguage: function fallbackLanguage(config) {
    return " Option " + chalk.bold("fallbackLanguage") + " was replaced by " + chalk.bold("fallbackLocale") + "\n\n    @lingui/cli now treats your current configuration as:\n    {\n      " + chalk.bold('"fallbackLocale"') + ": " + chalk.bold("\"" + config.fallbackLanguage + "\"") + "\n    }\n\n    Please update your configuration.\n    ";
  }
};

var configValidation = {
  exampleConfig: exampleConfig,
  deprecatedConfig: deprecatedConfig,
  comment: "See https://lingui.js.org/ref/conf.html for a list of valid options"
};

function configExists(path) {
  return path && fs.existsSync(path);
}

function getConfig() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      cwd = _ref.cwd,
      configPath = _ref.configPath;

  var configExplorer = cosmiconfig("lingui");
  var defaultRootDir = cwd || process.cwd();

  var result = configExists(configPath) ? configExplorer.loadSync(configPath) : configExplorer.searchSync(defaultRootDir);

  var raw = (0, _extends3.default)({}, defaultConfig, result ? result.config : {});

  validate(raw, configValidation);
  // Use deprecated fallbackLanguage, if defined
  raw.fallbackLocale = raw.fallbackLocale || raw.fallbackLanguage || "";

  var rootDir = result ? path.dirname(result.filepath) : defaultRootDir;
  return replaceRootDir(raw, rootDir);
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (source) {
  var options = _loaderUtils2.default.getOptions(this) || {};

  // Webpack 4 uses json-loader automatically, which breaks this loader because it
  // doesn't return JSON, but JS module. This is a temporary workaround before
  // official API is added (https://github.com/webpack/webpack/issues/7057#issuecomment-381883220)
  // See https://github.com/webpack/webpack/issues/7057
  if (JavascriptParser && JavascriptGenerator) {
    this._module.type = "javascript/auto";
    this._module.parser = new JavascriptParser();
    this._module.generator = new JavascriptGenerator();
  }

  var config = (0, _conf.getConfig)({
    configPath: options.config,
    cwd: _path2.default.dirname(this.resourcePath)
  });
  var catalog = (0, _api.configureCatalog)(config);

  var locale = catalog.getLocale(this.resourcePath);

  var catalogs = catalog.readAll();
  var messages = R.mapObjIndexed(function (_, key) {
    return catalog.getTranslation(catalogs, locale, key, {
      fallbackLocale: config.fallbackLocale,
      sourceLocale: config.sourceLocale
    });
  }, catalogs[locale]);

  // In production we don't want untranslated strings. It's better to use message
  // keys as a last resort.
  // In development, however, we want to catch missing strings with `missing` parameter
  // of I18nProvider (React) or setupI18n (core) and therefore we need to get
  // empty translations if missing.
  var strict = process.env.NODE_ENV !== "production";
  return (0, _api.createCompiledCatalog)(locale, messages, strict, config.compileNamespace, config.pseudoLocale);
};

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _ramda = require("ramda");

var R = _interopRequireWildcard(_ramda);

var _conf = require("@lingui/conf");

var _api = require("@lingui/cli/api");

var _loaderUtils = require("loader-utils");

var _loaderUtils2 = _interopRequireDefault(_loaderUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Check if JavascriptParser and JavascriptGenerator exists -> Webpack 4
var JavascriptParser = void 0;
var JavascriptGenerator = void 0;
try {
  JavascriptParser = require("webpack/lib/Parser");
  JavascriptGenerator = require("webpack/lib/JavascriptGenerator");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") {
    throw e;
  }
}
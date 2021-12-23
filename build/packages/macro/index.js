"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.number = exports.date = exports.selectOrdinal = exports.select = exports.plural = exports.t = exports.NumberFormat = exports.DateFormat = exports.SelectOrdinal = exports.Select = exports.Plural = exports.Trans = undefined;

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _babelPluginMacros = require("babel-plugin-macros");

var _js = require("./js");

var _js2 = _interopRequireDefault(_js);

var _transformer = require("@lingui/babel-plugin-transform-react/transformer");

var _transformer2 = _interopRequireDefault(_transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function macro(_ref) {
  var references = _ref.references,
      state = _ref.state,
      babel = _ref.babel;
  var t = babel.types;


  var transformer = (0, _js2.default)(babel);
  var jsxTransformer = new _transformer2.default(babel);
  var reactImportsToCarryOver = ["DateFormat", "NumberFormat"];
  var reactImports = [];

  (0, _keys2.default)(references).forEach(function (tagName) {
    var tags = references[tagName];
    var macroType = getMacroType(tagName);

    if (macroType === "jsx") {
      if (!reactImports.includes("Trans")) {
        reactImports.push("Trans");
      }

      if (reactImportsToCarryOver.includes(tagName)) {
        reactImports.push(tagName);
      }

      // Trick the plugin into thinking we've processed an import
      jsxTransformer.setImportDeclarations((0, _keys2.default)(references).reduce(function (obj, key) {
        if (key !== "default" || key !== "Trans") obj[key] = key;
        return obj;
      }, {}));

      tags.forEach(function (openingTag) {
        if (!t.isJSXOpeningElement(openingTag.container)) return; // Exclude closing elements

        var node = openingTag.context.parentPath.container;

        jsxTransformer.transform({ node: node }, state.file);
      });
    } else {
      tags.forEach(function (tag) {
        var expression = tag.parentPath;

        if (tagName === "t" && t.isCallExpression(expression)) {
          expression = expression.parentPath;
        }

        transformer(expression, state.file);
      });
    }
  });

  addLinguiReactImports(babel, state, reactImports);

  if (process.env.LINGUI_EXTRACT === "1") {
    return {
      keepImports: true
    };
  }
}

function getMacroType(tagName) {
  switch (tagName) {
    case "t":
    case "plural":
    case "select":
    case "selectOrdinal":
    case "number":
    case "date":
      return "js";
    case "Trans":
    case "Plural":
    case "Select":
    case "SelectOrdinal":
    case "NumberFormat":
    case "DateFormat":
      return "jsx";
  }
}

function addLinguiReactImports(babel, state, imports) {
  if (!imports.length) return;

  var t = babel.types;


  var linguiReactImport = state.file.path.node.body.find(function (importNode) {
    return t.isImportDeclaration(importNode) && importNode.source.value === "@lingui/react";
  });

  // Handle adding the import or altering the existing import
  if (linguiReactImport) {
    imports.forEach(function (name) {
      if (linguiReactImport.specifiers.findIndex(function (specifier) {
        return specifier.imported && specifier.imported.name === name;
      }) === -1) {
        linguiReactImport.specifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)));
      }
    });
  } else {
    state.file.path.node.body.unshift(t.importDeclaration(imports.map(function (name) {
      return t.importSpecifier(t.identifier(name), t.identifier(name));
    }), t.stringLiteral("@lingui/react")));
  }
}

var Trans = function Trans() {};
var Plural = function Plural() {};
var Select = function Select() {};
var SelectOrdinal = function SelectOrdinal() {};
var DateFormat = function DateFormat() {};
var NumberFormat = function NumberFormat() {};

var t = function t() {};
var plural = function plural() {};
var select = function select() {};
var selectOrdinal = function selectOrdinal() {};
var date = function date() {};
var number = function number() {};

exports.Trans = Trans;
exports.Plural = Plural;
exports.Select = Select;
exports.SelectOrdinal = SelectOrdinal;
exports.DateFormat = DateFormat;
exports.NumberFormat = NumberFormat;
exports.t = t;
exports.plural = plural;
exports.select = select;
exports.selectOrdinal = selectOrdinal;
exports.date = date;
exports.number = number;
exports.default = (0, _babelPluginMacros.createMacro)(macro);
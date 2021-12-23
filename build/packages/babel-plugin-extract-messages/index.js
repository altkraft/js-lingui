"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _weakSet = require("babel-runtime/core-js/weak-set");

var _weakSet2 = _interopRequireDefault(_weakSet);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _includes = require("babel-runtime/core-js/array/includes");

var _includes2 = _interopRequireDefault(_includes);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

exports.default = function (_ref2) {
  var t = _ref2.types;

  var localTransComponentName = void 0;

  var opts = (0, _conf.getConfig)();
  var optsBaseDir = opts.rootDir;

  function isTransComponent(node) {
    return t.isJSXElement(node) && t.isJSXIdentifier(node.openingElement.name, {
      name: localTransComponentName
    });
  }

  var isNoopMethod = function isNoopMethod(node) {
    return t.isIdentifier(node, { name: "i18nMark" });
  };
  var isI18nMethod = function isI18nMethod(node) {
    return t.isMemberExpression(node) && t.isIdentifier(node.object, { name: "i18n" }) && t.isIdentifier(node.property, { name: "_" });
  };

  function collectMessage(path, file, props) {
    var messages = file.get(MESSAGES);

    var filename = _path2.default.relative(optsBaseDir, file.opts.filename).replace(/\\/g, "/");
    var line = path.node.loc ? path.node.loc.start.line : null;
    props.origin = [[filename, line]];

    addMessage(path, messages, props);
  }

  return {
    visitor: {
      // Get the local name of Trans component. Usually it's just `Trans`, but
      // it might be different when the import is aliased:
      // import { Trans as T } from '@lingui/react';
      ImportDeclaration: function ImportDeclaration(path) {
        var node = path.node;


        var moduleName = node.source.value;
        if (!(0, _includes2.default)(["@lingui/react", "@lingui/macro", "@lingui/core"], moduleName)) return;

        var importDeclarations = {};
        if (moduleName === "@lingui/react" || moduleName === "@lingui/macro") {
          node.specifiers.forEach(function (specifier) {
            importDeclarations[specifier.imported.name] = specifier.local.name;
          });

          // Trans import might be missing if there's just Plural or similar macro.
          // If there's no alias, consider it was imported as Trans.
          localTransComponentName = importDeclarations["Trans"] || "Trans";
        }

        // Remove imports of i18nMark identity
        node.specifiers = node.specifiers.filter(function (specifier) {
          return specifier.imported.name !== "i18nMark";
        });

        if (!node.specifiers.length) {
          path.remove();
        }
      },


      // Extract translation from <Trans /> component.
      JSXElement: function JSXElement(path, _ref3) {
        var file = _ref3.file;
        var node = path.node;

        if (!localTransComponentName || !isTransComponent(node)) return;

        var attrs = node.openingElement.attributes || [];

        var props = attrs.reduce(function (acc, item) {
          var key = item.name.name;
          if (key === "id" || key === "defaults" || key === "description") {
            if (item.value.value) {
              acc[key] = item.value.value;
            } else if (item.value.expression && t.isStringLiteral(item.value.expression)) {
              acc[key] = item.value.expression.value;
            }
          }
          return acc;
        }, {});

        if (!props.id) {
          // <Trans id={message} /> is valid, don't raise warning
          var idProp = attrs.filter(function (item) {
            return item.name.name === "id";
          })[0];
          if (idProp === undefined || t.isLiteral(props.id)) {
            console.warn("Missing message ID, skipping.");
            console.warn((0, _babelGenerator2.default)(node).code);
          }
          return;
        }

        collectMessage(path, file, props);
      },


      // Extract translation from i18n._ call
      CallExpression: function CallExpression(path, _ref4) {
        var file = _ref4.file;
        var node = path.node;

        var visited = file.get(VISITED);

        if (
        // we already visited this node
        visited.has(node.callee) ||
        // nothing to extract
        !isI18nMethod(node.callee) && !isNoopMethod(node.callee)) {
          return;
        }

        visited.add(node.callee);

        if (isNoopMethod(node.callee) && !t.isStringLiteral(node.arguments[0])) {
          console.warn("Only string literals are allowed in i18nMark.");
          return;
        }

        var attrs = node.arguments[2] && node.arguments[2].properties ? node.arguments[2].properties : [];

        var idArg = node.arguments[0];
        var id = idArg && idArg.value;
        if (!id) {
          // i18n._(message) is valid, don't raise warning
          if (idArg === undefined || t.isLiteral(idArg)) {
            console.warn("Missing message ID, skipping.");
            console.warn((0, _babelGenerator2.default)(node).code);
          }

          return;
        }

        var props = attrs.reduce(function (acc, item) {
          var key = item.key.name;
          if (key === "defaults") acc[key] = item.value.value;
          return acc;
        }, { id: id });

        collectMessage(path, file, props);

        if (isNoopMethod(node.callee)) {
          var translation = node.arguments[0];
          path.replaceWith(t.stringLiteral(translation.value));
        }
      },


      // Extract message descriptors
      ObjectExpression: function ObjectExpression(path, _ref5) {
        var file = _ref5.file;

        var visited = file.get(VISITED);

        var comment = path.node.leadingComments && path.node.leadingComments.filter(function (node) {
          return node.value.match(/^\s*i18n/);
        })[0];

        if (!comment || visited.has(path.node)) {
          return;
        }

        visited.add(path.node);

        var props = {};

        var description = comment.value.replace(/\s*i18n:?\s*/, "").trim();
        if (description) props.description = description;

        var copyProps = ["id", "defaults"];
        path.node.properties.filter(function (_ref6) {
          var key = _ref6.key;
          return copyProps.indexOf(key.name) !== -1;
        }).forEach(function (_ref7) {
          var key = _ref7.key,
              value = _ref7.value;

          props[key.name] = value.value;
        });

        collectMessage(path, file, props);
      }
    },

    pre: function pre(file) {
      localTransComponentName = null;

      // Ignore else path for now. Collision is possible if other plugin is
      // using the same Symbol('I18nMessages').
      // istanbul ignore else
      if (!file.has(MESSAGES)) {
        file.set(MESSAGES, new _map2.default());
      }

      file.set(VISITED, new _weakSet2.default());
    },
    post: function post(file) {
      /* Write catalog to directory `localeDir`/_build/`path.to.file`/`filename`.json
       * e.g: if file is src/components/App.js (relative to package.json), then
       * catalog will be in locale/_build/src/components/App.json
       */
      var localeDir = this.opts.localeDir || opts.localeDir;
      var filename = file.opts.filename;

      var baseDir = _path2.default.dirname(_path2.default.relative(optsBaseDir, filename));
      var targetDir = _path2.default.join(localeDir, "_build", baseDir);

      var messages = file.get(MESSAGES);
      var catalog = {};
      var baseName = _path2.default.basename(filename);
      var catalogFilename = _path2.default.join(targetDir, baseName + ".json");

      _mkdirp2.default.sync(targetDir);

      // no messages, skip file
      if (!messages.size) {
        // clean any existing catalog
        if (_fs2.default.existsSync(catalogFilename)) {
          _fs2.default.writeFileSync(catalogFilename, (0, _stringify2.default)({}));
        }

        return;
      }

      messages.forEach(function (value, key) {
        catalog[key] = value;
      });

      _fs2.default.writeFileSync(catalogFilename, (0, _stringify2.default)(catalog, null, 2));
    }
  };
};

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require("mkdirp");

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _conf = require("@lingui/conf");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Map of messages
var MESSAGES = (0, _symbol2.default)("I18nMessages");

// We need to remember all processed nodes. When JSX expressions are
// replaced with CallExpressions, all children are traversed for each CallExpression.
// Then, i18n._ methods are visited multiple times for each parent CallExpression.
var VISITED = (0, _symbol2.default)("I18nVisited");

function addMessage(path, messages, _ref) {
  var id = _ref.id,
      defaults = _ref.defaults,
      origin = _ref.origin,
      props = (0, _objectWithoutProperties3.default)(_ref, ["id", "defaults", "origin"]);

  if (messages.has(id)) {
    var message = messages.get(id);

    // only set/check default language when it's defined.
    if (message.defaults && defaults && message.defaults !== defaults) {
      throw path.buildCodeFrameError("Different defaults for the same message ID.");
    } else {
      if (defaults) {
        message.defaults = defaults;
      }

      ;[].push.apply(message.origin, origin);
    }
  } else {
    messages.set(id, (0, _extends3.default)({}, props, { defaults: defaults, origin: origin }));
  }
}
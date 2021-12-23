"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.default = function (babel) {
  var t = babel.types;


  var transformer = new _transformer2.default(babel);

  return {
    visitor: {
      Program: function Program(path, state) {
        // Reset import declaration for each file.
        // Regression introduced in https://github.com/lingui/js-lingui/issues/62

        var importedNames = state.opts.importedNames;
        if (importedNames) {
          var importDeclarations = {};

          importedNames.forEach(function (name) {
            if (typeof name === "string") {
              name = [name, name];
            }

            var _name = name,
                _name2 = (0, _slicedToArray3.default)(_name, 2),
                imported = _name2[0],
                local = _name2[1];

            importDeclarations[imported] = local;
          });

          transformer.setImportDeclarations(importDeclarations);
        } else {
          transformer.setImportDeclarations({});
        }
      },

      JSXElement: transformer.transform,
      ImportDeclaration: function ImportDeclaration(_ref) {
        var node = _ref.node;

        var importDeclarations = transformer.getImportDeclarations();

        var moduleName = node.source.value;
        if (moduleName !== "@lingui/react") return;

        node.specifiers.forEach(function (specifier) {
          importDeclarations[specifier.imported.name] = specifier.local.name;
        });

        // Choices components are converted to Trans,
        // so imports can be safely removed
        var choicesComponents = ["Plural", "Select", "SelectOrdinal"];
        var isChoiceComponent = function isChoiceComponent(specifier) {
          return choicesComponents.includes(specifier.imported.name);
        };

        var hasChoices = node.specifiers.filter(isChoiceComponent).length;

        if (hasChoices) {
          node.specifiers = [
          // Import for `Trans` component should be there always
          t.importSpecifier(t.identifier(transformer.getLocalImportName("Trans")), t.identifier("Trans"))].concat((0, _toConsumableArray3.default)(node.specifiers.filter(function (specifier) {
            return !isChoiceComponent(specifier) && specifier.imported.name !== "Trans";
          })));
        }

        transformer.setImportDeclarations(importDeclarations);
      }
    } // visitor
  };
};

var _transformer = require("./transformer");

var _transformer2 = _interopRequireDefault(_transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pluralRules = ["zero", "one", "two", "few", "many", "other"];
var commonProps = ["id", "className", "render"];

// replace whitespace before/after newline with single space
var nlRe = /\s*(?:\r\n|\r|\n)+\s*/g;
// remove whitespace before/after tag
var nlTagRe = /(?:(>)(?:\r\n|\r|\n)+\s+|(?:\r\n|\r|\n)+\s+(?=<))/g;

function cleanChildren(node) {
  node.children = [];
  node.openingElement.selfClosing = true;
}

var mergeProps = function mergeProps(props, nextProps) {
  return {
    text: props.text + nextProps.text,
    values: (0, _assign2.default)({}, props.values, nextProps.values),
    components: props.components.concat(nextProps.components),
    formats: props.formats,
    elementIndex: nextProps.elementIndex
  };
};

var initialProps = function initialProps() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      formats = _ref.formats;

  return {
    text: "",
    values: {},
    components: [],
    formats: formats || {}
  };
};

var generatorFactory = function generatorFactory() {
  var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  return function () {
    return index++;
  };
};

var Transformer = function () {
  function Transformer(_ref2) {
    var t = _ref2.types;
    (0, _classCallCheck3.default)(this, Transformer);

    _initialiseProps.call(this);

    this.t = t;

    this.isTransElement = this.elementName("Trans");
  }

  (0, _createClass3.default)(Transformer, [{
    key: "getOriginalImportName",
    value: function getOriginalImportName(local) {
      var _this = this;

      // Either find original import name or use local one
      var original = (0, _keys2.default)(this.importDeclarations).filter(function (name) {
        return _this.importDeclarations[name] === local;
      })[0];

      return original || local;
    }
  }, {
    key: "getLocalImportName",
    value: function getLocalImportName(name) {
      var strict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this.importDeclarations[name] || !strict && name;
    }
  }, {
    key: "isIdAttribute",
    value: function isIdAttribute(node) {
      return this.t.isJSXAttribute(node) && this.t.isJSXIdentifier(node.name, { name: "id" });
    }
  }, {
    key: "isDefaultsAttribute",
    value: function isDefaultsAttribute(node) {
      return this.t.isJSXAttribute(node) && this.t.isJSXIdentifier(node.name, { name: "defaults" });
    }
  }, {
    key: "isDescriptionAttribute",
    value: function isDescriptionAttribute(node) {
      return this.t.isJSXAttribute(node) && this.t.isJSXIdentifier(node.name, { name: "description" });
    }
  }, {
    key: "processElement",
    value: function processElement(node, file, props) {
      var root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var t = this.t;
      var element = node.openingElement;

      // Trans
      if (this.isTransElement(node)) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(node.children), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var child = _step.value;

            props = this.processChildren(child, file, props);
          }

          // Plural, Select, SelectOrdinal
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else if (this.isChooseElement(node)) {
        var componentName = this.getOriginalImportName(element.name.name);

        if (node.children.length) {
          throw file.buildCodeFrameError(element, "Children of " + componentName + " aren't allowed.");
        }

        var choicesType = componentName.toLowerCase();
        var choices = {};
        var variable = void 0;
        var offset = "";

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = (0, _getIterator3.default)(element.attributes), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var attr = _step2.value;
            var name = attr.name.name;


            if (name === "value") {
              var exp = t.isLiteral(attr.value) ? attr.value : attr.value.expression;
              variable = t.isIdentifier(exp) ? exp.name : this.argumentGenerator();
              var key = t.isIdentifier(exp) ? exp : t.numericLiteral(variable);
              props.values[variable] = t.objectProperty(key, exp);
            } else if (commonProps.includes(name)) {
              // just do nothing
            } else if (choicesType !== "select" && name === "offset") {
              // offset is static parameter, so it must be either string or number
              var offsetExp = t.isStringLiteral(attr.value) ? attr.value : attr.value.expression;

              if (offsetExp.value === undefined) {
                throw file.buildCodeFrameError(element, "Offset argument cannot be a variable.");
              }

              offset = " offset:" + offsetExp.value;
            } else {
              props = this.processChildren(attr.value, file, (0, _assign2.default)({}, props, { text: "" }));
              choices[name.replace("_", "=")] = props.text;
            }
          }

          // missing value
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        if (variable === undefined) {
          throw file.buildCodeFrameError(element, "Value argument is missing.");
        }

        var choicesKeys = (0, _keys2.default)(choices);

        // 'other' choice is required
        if (!choicesKeys.length) {
          throw file.buildCodeFrameError(element, "Missing " + choicesType + " choices. At least fallback argument 'other' is required.");
        } else if (!choicesKeys.includes("other")) {
          throw file.buildCodeFrameError(element, "Missing fallback argument 'other'.");
        }

        // validate plural rules
        if (choicesType === "plural" || choicesType === "selectordinal") {
          choicesKeys.forEach(function (rule) {
            if (!pluralRules.includes(rule) && !/=\d+/.test(rule)) {
              throw file.buildCodeFrameError(element, "Invalid plural rule '" + rule + "'. Must be " + pluralRules.join(", ") + " or exact number depending on your source language ('one' and 'other' for English).");
            }
          });
        }

        var argument = choicesKeys.map(function (form) {
          return form + " {" + choices[form] + "}";
        }).join(" ");

        props.text = "{" + variable + ", " + choicesType + "," + offset + " " + argument + "}";
        element.attributes = element.attributes.filter(function (attr) {
          return commonProps.includes(attr.name.name);
        });
        element.name = t.JSXIdentifier(this.getLocalImportName("Trans"));
      } else if (this.isFormatElement(node)) {
        if (root) {
          // Don't convert standalone Format elements to ICU MessageFormat.
          // It doesn't make sense to have `{name, number}` message, because we
          // can call number() formatter directly in component.
          return;
        }

        var type = this.getOriginalImportName(element.name.name).toLowerCase().replace("format", "");

        var _variable = void 0,
            format = void 0;

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = (0, _getIterator3.default)(element.attributes), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _attr = _step3.value;
            var _name = _attr.name.name;


            if (_name === "value") {
              var _exp = t.isLiteral(_attr.value) ? _attr.value : _attr.value.expression;
              _variable = t.isIdentifier(_exp) ? _exp.name : this.argumentGenerator();
              var _key = t.isIdentifier(_exp) ? _exp : t.numericLiteral(_variable);
              props.values[_variable] = t.objectProperty(_key, _exp);
            } else if (_name === "format") {
              if (t.isStringLiteral(_attr.value)) {
                format = _attr.value.value;
              } else if (t.isJSXExpressionContainer(_attr.value)) {
                var _exp2 = _attr.value.expression;
                if (t.isStringLiteral(_exp2)) {
                  format = _exp2.value;
                } else if (t.isObjectExpression(_exp2) || t.isIdentifier(_exp2)) {
                  if (t.isIdentifier(_exp2)) {
                    format = _exp2.name;
                  } else {
                    (function () {
                      var formatName = new RegExp("^" + type + "\\d+$");
                      var existing = (0, _keys2.default)(props.formats).filter(function (name) {
                        return formatName.test(name);
                      });
                      format = "" + type + (existing.length || 0);
                    })();
                  }
                  props.formats[format] = t.objectProperty(t.identifier(format), _exp2);
                }
              }

              if (!format) {
                throw file.buildCodeFrameError(element, "Format can be either string for buil-in formats, variable or object for custom defined formats.");
              }
            }
          }

          // missing value
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        if (_variable === undefined) {
          throw file.buildCodeFrameError(element, "Value argument is missing.");
        }

        var parts = [_variable, type];

        if (format) parts.push(format);

        props.text = "{" + parts.join(",") + "}";
        element.attributes = element.attributes.filter(function (attr) {
          return commonProps.includes(attr.name.name);
        });
        element.name = t.JSXIdentifier(this.getLocalImportName("Trans"));
        // Other elements
      } else {
        if (root) return;

        var index = this.elementGenerator();
        var selfClosing = node.openingElement.selfClosing;

        props.text += !selfClosing ? "<" + index + ">" : "<" + index + "/>";

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = (0, _getIterator3.default)(node.children), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _child = _step4.value;

            props = this.processChildren(_child, file, props);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        if (!selfClosing) props.text += "</" + index + ">";

        cleanChildren(node);
        props.components.unshift(node);
      }

      return props;
    }
  }, {
    key: "processChildren",
    value: function processChildren(node, file, props) {
      var _this2 = this;

      var t = this.t;
      var nextProps = initialProps({ formats: props.formats });

      if (t.isJSXExpressionContainer(node)) {
        var exp = node.expression;

        if (t.isStringLiteral(exp)) {
          nextProps.text += exp.value;
        } else if (t.isTemplateLiteral(exp)) {
          var parts = [];

          exp.quasis.forEach(function (item, index) {
            parts.push(item);

            if (!item.tail) parts.push(exp.expressions[index]);
          });

          parts.forEach(function (item) {
            if (t.isTemplateElement(item)) {
              nextProps.text += item.value.raw;
            } else {
              var name = t.isIdentifier(item) ? item.name : _this2.argumentGenerator();
              var key = t.isIdentifier(item) ? item : t.numericLiteral(name);
              nextProps.text += "{" + name + "}";
              nextProps.values[name] = t.objectProperty(key, item);
            }
          });
        } else if (t.isJSXElement(exp)) {
          nextProps = this.processElement(exp, file, nextProps);
        } else {
          var name = t.isIdentifier(exp) ? exp.name : this.argumentGenerator();
          var key = t.isIdentifier(exp) ? exp : t.numericLiteral(name);
          nextProps.text += "{" + name + "}";
          nextProps.values[name] = t.objectProperty(key, exp);
        }
      } else if (t.isJSXElement(node)) {
        nextProps = this.processElement(node, file, nextProps);
      } else if (t.isJSXSpreadChild(node)) {
        // TODO: I don't have a clue what's the usecase
      } else {
        nextProps.text += node.value;
      }

      return mergeProps(props, nextProps);
    }

    /**
     * Used for macro
     * @param imports
     */

  }, {
    key: "setImportDeclarations",
    value: function setImportDeclarations(imports) {
      // Used for the macro to override the imports
      this.importDeclarations = imports;
    }
  }, {
    key: "getImportDeclarations",
    value: function getImportDeclarations() {
      return this.importDeclarations;
    }
  }]);
  return Transformer;
}();

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.elementName = function (name) {
    return function (node) {
      return _this3.t.isJSXElement(node) && _this3.t.isJSXIdentifier(node.openingElement.name, {
        name: _this3.getLocalImportName(name, true)
      });
    };
  };

  this.isChooseElement = function (node) {
    return _this3.elementName("Plural")(node) || _this3.elementName("Select")(node) || _this3.elementName("SelectOrdinal")(node);
  };

  this.isFormatElement = function (node) {
    return _this3.elementName("DateFormat")(node) || _this3.elementName("NumberFormat")(node);
  };

  this.transform = function (path, file) {
    if (!_this3.importDeclarations || !(0, _keys2.default)(_this3.importDeclarations).length) {
      return;
    }

    var node = path.node;

    var t = _this3.t;
    _this3.elementGenerator = generatorFactory();
    _this3.argumentGenerator = generatorFactory();

    // 1. Collect all parameters and inline elements and generate message ID
    var props = _this3.processElement(node, file, initialProps(),
    /* root= */true);

    if (!props) return;

    // 2. Replace children and add collected data

    cleanChildren(node);
    var text = props.text.replace(nlTagRe, "$1").replace(nlRe, " ").trim();
    var attrs = node.openingElement.attributes;

    // If `id` prop already exists and generated ID is different,
    // add it as a `default` prop
    var idAttr = attrs.filter(_this3.isIdAttribute.bind(_this3))[0];
    if (idAttr && text && idAttr.value.value !== text) {
      attrs.push(t.JSXAttribute(t.JSXIdentifier("defaults"), t.StringLiteral(text)));
    } else if (!idAttr) {
      attrs.push(t.JSXAttribute(t.JSXIdentifier("id"), t.StringLiteral(text)));
    }

    // Parameters for variable substitution
    var valuesList = (0, _values2.default)(props.values);
    if (valuesList.length) {
      attrs.push(t.JSXAttribute(t.JSXIdentifier("values"), t.JSXExpressionContainer(t.objectExpression(valuesList))));
    }

    // Inline elements
    if (props.components.length) {
      attrs.push(t.JSXAttribute(t.JSXIdentifier("components"), t.JSXExpressionContainer(t.arrayExpression(props.components))));
    }

    // Custom formats
    var formatsList = (0, _values2.default)(props.formats);
    if (formatsList.length) {
      attrs.push(t.JSXAttribute(t.JSXIdentifier("formats"), t.JSXExpressionContainer(t.objectExpression(formatsList))));
    }

    if (process.env.NODE_ENV === "production") {
      node.openingElement.attributes = attrs.filter(function (node) {
        return !_this3.isDefaultsAttribute(node) && !_this3.isDescriptionAttribute(node);
      });
    }
  };
};

exports.default = Transformer;
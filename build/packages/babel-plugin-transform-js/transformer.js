"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _includes = require("babel-runtime/core-js/array/includes");

var _includes2 = _interopRequireDefault(_includes);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var nlRe = /(?:\r\n|\r|\n)+\s+/g;

var pluralRules = ["zero", "one", "two", "few", "many", "other"];

var generatorFactory = function generatorFactory() {
  var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  return function () {
    return index++;
  };
};

var initialProps = function initialProps() {
  return {
    text: "",
    values: {},
    formats: {}
  };
};

var Transformer = function () {
  function Transformer(_ref) {
    var _this = this;

    var t = _ref.types;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, Transformer);

    this.transform = function (path, file) {
      _this.argumentGenerator = generatorFactory();

      // 1. Collect all parameters and generate message ID

      var props = _this.transformMethod(path.node, file, initialProps(), true);

      var text = props.text.replace(nlRe, " ").trim();
      if (!text) return;

      // 2. Replace complex expression with single call to i18n._

      var tOptions = [];

      var formatsList = (0, _values2.default)(props.formats);
      if (formatsList.length) {
        tOptions.push(_this.t.objectProperty(_this.t.identifier("formats"), _this.t.objectExpression(formatsList)));
      }

      if (props.defaults) {
        tOptions.push(_this.t.objectProperty(_this.t.identifier("defaults"), _this.t.stringLiteral(props.defaults)));
      }

      // arguments of i18n._(messageId: string, values: Object, options: Object)
      var tArgs = [_this.t.StringLiteral(text)]; // messageId

      var valuesList = (0, _values2.default)(props.values);
      // omit second argument when there're no values and no options,
      // i.e: simplify i18n._(id, {}) to i18n._(id)
      if (valuesList.length || tOptions.length) {
        tArgs.push(_this.t.objectExpression(valuesList.length ? valuesList : []));
      }

      // add options argument
      if (tOptions.length) tArgs.push(_this.t.objectExpression(tOptions));

      // replace i18n.t`...` with i18n._(...), but remember original location
      var exp = _this.t.callExpression(_this.t.memberExpression(_this.t.identifier("i18n"), _this.t.identifier("_")), tArgs);
      exp.loc = path.node.loc;
      path.replaceWith(exp);
    };

    this.options = options;
    this.t = t;

    if (this.options.standalone) {
      this.isI18nMethod = function (node) {
        return _this._isIdentifier(node.tag, "t") || _this.t.isCallExpression(node.tag) && _this._isIdentifier(node.tag.callee, "t");
      };

      this.isChoiceMethod = function (node) {
        return _this._isIdentifier(node, "plural") || _this._isIdentifier(node, "select") || _this._isIdentifier(node, "selectOrdinal");
      };

      this.isFormatMethod = function (node) {
        return _this._isIdentifier(node, "date") || _this._isIdentifier(node, "number");
      };
    } else {
      this.isI18nMethod = function (node) {
        return _this.t.isMemberExpression(node.tag) && _this.t.isIdentifier(node.tag.object, { name: "i18n" }) && _this.t.isIdentifier(node.tag.property, { name: "t" }) || _this.t.isCallExpression(node.tag) && _this.t.isMemberExpression(node.tag.callee) && _this.t.isIdentifier(node.tag.callee.object, { name: "i18n" }) && _this.t.isIdentifier(node.tag.callee.property, { name: "t" });
      };

      this.isChoiceMethod = function (node) {
        return _this.t.isMemberExpression(node) && _this.t.isIdentifier(node.object, { name: "i18n" }) && (_this._isIdentifier(node.property, "plural") || _this._isIdentifier(node.property, "select") || _this._isIdentifier(node.property, "selectOrdinal"));
      };

      this.isFormatMethod = function (node) {
        return _this.t.isMemberExpression(node) && _this.t.isIdentifier(node.object, { name: "i18n" }) && (_this._isIdentifier(node.property, "date") || _this._isIdentifier(node.property, "number"));
      };
    }
  }

  /**
   * Convert identifiers to *named* arguments and everything else
   * to *positional* arguments.
   *
   * Example:
   * `world` is named argument and `new Date()` is positional one
   *
   * Input:   `Hello ${world}, today is ${new Date()}`
   * Output:  `Hello {world}, today is {0}`
   */


  (0, _createClass3.default)(Transformer, [{
    key: "expressionToArgument",
    value: function expressionToArgument(exp) {
      var name = this.t.isIdentifier(exp) ? exp.name : this.argumentGenerator();
      var key = this.t.isIdentifier(exp) ? exp : this.t.numericLiteral(name);

      return { name: name, key: key };
    }
  }, {
    key: "transformI18nMethod",
    value: function transformI18nMethod(node, file, props) {
      if (this.t.isCallExpression(node.tag)) {
        // Message with custom ID, where message is used as defaults
        // i18n.t('id')`Hello World`
        var defaults = node.tag.arguments[0];
        if (!this.t.isStringLiteral(defaults)) {
          throw file.buildCodeFrameError(node.tag, "Message ID must be a string");
        }
        var newProps = this.transformTemplateLiteral(node.quasi, file, props);
        return (0, _extends3.default)({}, newProps, {
          text: defaults.value,
          defaults: props.text
        });
      }

      // Message is used as the ID
      // i18n.t`Hello World`
      return this.transformTemplateLiteral(node.quasi, file, props);
    }
  }, {
    key: "transformChoiceMethod",
    value: function transformChoiceMethod(node, file, props) {
      var root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var choices = {};
      var choicesType = this._calleeName(node).toLowerCase();
      var defaults = void 0;
      var variable = void 0;
      var offset = "";

      var choiceArguments = node.arguments[0];
      if (this.t.isStringLiteral(choiceArguments)) {
        defaults = choiceArguments.value;
        choiceArguments = node.arguments[1];
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(choiceArguments.properties), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var attr = _step.value;

          if (attr.computed) {
            throw file.buildCodeFrameError(attr, "Computed properties aren't allowed.");
          }

          var key = attr.key;
          // key is either:
          // NumericLiteral => convert to `={number}`
          // StringLiteral => key.value
          // Literal => key.name

          var name = this.t.isNumericLiteral(key) ? "=" + key.value : key.name || key.value;

          if (name === "value") {
            var exp = attr.value;

            var _expressionToArgument = this.expressionToArgument(exp),
                _name = _expressionToArgument.name,
                _key = _expressionToArgument.key;

            variable = _name;
            props.values[_name] = this.t.objectProperty(_key, exp);
          } else if (choicesType !== "select" && name === "offset") {
            // offset is static parameter, so it must be either string or number
            if (!this.t.isNumericLiteral(attr.value) && !this.t.isStringLiteral(attr.value)) {
              throw file.buildCodeFrameError(node.callee, "Offset argument cannot be a variable.");
            }
            offset = " offset:" + attr.value.value;
          } else {
            var value = "";

            if (this.t.isTemplateLiteral(attr.value)) {
              props = this.transformTemplateLiteral(attr.value, file, (0, _extends3.default)({}, props, {
                text: ""
              }));
              value = props.text;
            } else if (this.t.isCallExpression(attr.value)) {
              props = this.transformMethod(attr.value, file, (0, _extends3.default)({}, props, { text: "" }));
              value = props.text;
            } else {
              value = attr.value.value;
            }
            choices[name] = value;
          }
        }

        // missing value
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

      if (variable === undefined) {
        throw file.buildCodeFrameError(node.callee, "Value argument is missing.");
      }

      var choicesKeys = (0, _keys2.default)(choices);

      // 'other' choice is required
      if (!choicesKeys.length) {
        throw file.buildCodeFrameError(node.callee, "Missing " + choicesType + " choices. At least fallback argument 'other' is required.");
      } else if (!(0, _includes2.default)(choicesKeys, "other")) {
        throw file.buildCodeFrameError(node.callee, "Missing fallback argument 'other'.");
      }

      // validate plural rules
      if (choicesType === "plural" || choicesType === "selectordinal") {
        choicesKeys.forEach(function (rule) {
          if (!(0, _includes2.default)(pluralRules, rule) && !/=\d+/.test(rule)) {
            throw file.buildCodeFrameError(node.callee, "Invalid plural rule '" + rule + "'. Must be " + pluralRules.join(", ") + " or exact number depending on your source language ('one' and 'other' for English).");
          }
        });
      }

      var argument = choicesKeys.map(function (form) {
        return form + " {" + choices[form] + "}";
      }).join(" ");
      var format = variable + ", " + choicesType + "," + offset + " " + argument;
      props.text = root ? "{" + format + "}" : format;

      if (defaults) {
        return (0, _extends3.default)({}, props, {
          text: defaults,
          defaults: props.text
        });
      }

      return props;
    }
  }, {
    key: "transformFormatMethod",
    value: function transformFormatMethod(node, file, props, root) {
      var exp = node.arguments[0];

      // missing value
      if (exp === undefined) {
        throw file.buildCodeFrameError(node.callee, "The first argument of format function must be a variable.");
      }

      var _expressionToArgument2 = this.expressionToArgument(exp),
          name = _expressionToArgument2.name,
          key = _expressionToArgument2.key;

      var type = this._calleeName(node);
      var parts = [name, // variable name
      type // format type
      ];

      var format = "";
      var formatArg = node.arguments[1];
      if (!formatArg) {
        // Do not throw validation error when format doesn't exist
      } else if (this.t.isStringLiteral(formatArg)) {
        format = formatArg.value;
      } else if (this.t.isIdentifier(formatArg) || this.t.isObjectExpression(formatArg)) {
        if (this.t.isIdentifier(formatArg)) {
          format = formatArg.name;
        } else {
          var formatName = new RegExp("^" + type + "\\d+$");
          var existing = (0, _keys2.default)(props.formats).filter(function (name) {
            return formatName.test(name);
          });
          format = "" + type + (existing.length || 0);
        }

        props.formats[format] = this.t.objectProperty(this.t.identifier(format), formatArg);
      } else {
        throw file.buildCodeFrameError(formatArg, "Format can be either string for buil-in formats, variable or object for custom defined formats.");
      }

      if (format) parts.push(format);

      props.values[name] = this.t.objectProperty(key, exp);
      props.text += "" + parts.join(",");

      return props;
    }
  }, {
    key: "transformTemplateLiteral",
    value: function transformTemplateLiteral(exp, file, props) {
      var _this2 = this;

      var parts = [];

      exp.quasis.forEach(function (item, index) {
        parts.push(item);

        if (!item.tail) parts.push(exp.expressions[index]);
      });

      parts.forEach(function (item) {
        if (_this2.t.isTemplateElement(item)) {
          props.text += item.value.raw;
        } else if (_this2.t.isCallExpression(item) && (_this2.isI18nMethod(item.callee) || _this2.isChoiceMethod(item.callee) || _this2.isFormatMethod(item.callee))) {
          var _transformMethod = _this2.transformMethod(item, file, (0, _extends3.default)({}, props, {
            text: ""
          })),
              text = _transformMethod.text;

          props.text += "{" + text + "}";
        } else {
          var _expressionToArgument3 = _this2.expressionToArgument(item),
              name = _expressionToArgument3.name,
              key = _expressionToArgument3.key;

          props.text += "{" + name + "}";
          props.values[name] = _this2.t.objectProperty(key, item);
        }
      });

      return props;
    }
  }, {
    key: "transformMethod",
    value: function transformMethod(node, file, props) {
      var root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      if (this.isI18nMethod(node)) {
        // i18n.t
        return this.transformI18nMethod(node, file, props);
      } else if (this.isChoiceMethod(node.callee)) {
        // i18n.plural, i18n.select and i18n.selectOrdinal
        return this.transformChoiceMethod(node, file, props, root);
      } else if (this.isFormatMethod(node.callee)) {
        // i18n.date, i18n.number
        return this.transformFormatMethod(node, file, props, root);
      }

      return props;
    }
  }, {
    key: "_isIdentifier",
    value: function _isIdentifier(node, name) {
      return this.t.isIdentifier(node, { name: name });
    }
  }, {
    key: "_calleeName",
    value: function _calleeName(node) {
      if (this.options.standalone) {
        return node.callee.name;
      } else {
        return node.callee.property.name;
      }
    }
  }]);
  return Transformer;
}();

exports.default = Transformer;
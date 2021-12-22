"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _includes = require("babel-runtime/core-js/array/includes");

var _includes2 = _interopRequireDefault(_includes);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

exports.default = function (_ref) {
  var t = _ref.types;

  var isIdentifier = function isIdentifier(node, name) {
    return t.isIdentifier(node, { name: name });
  };

  var isI18nMethod = function isI18nMethod(node) {
    return isIdentifier(node.tag, "t") || t.isCallExpression(node.tag) && isIdentifier(node.tag.callee, "t");
  };

  var isChoiceMethod = function isChoiceMethod(node) {
    return isIdentifier(node, "plural") || isIdentifier(node, "select") || isIdentifier(node, "selectOrdinal");
  };

  var isFormatMethod = function isFormatMethod(node) {
    return isIdentifier(node, "date") || isIdentifier(node, "number");
  };

  /**
   * Convert identifiers to *named* arguments and everything else
   * to *positional* arguments.
   *
   * Example
   * `world` is named argument and `new Date()` is positional one
   *
   * Input:   `Hello ${world}, today is ${new Date()}`
   * Output:  `Hello {world}, today is {0}`
   */
  function expressionToArgument(exp, props) {
    var name = t.isIdentifier(exp) ? exp.name : props.argumentGenerator();
    var key = t.isIdentifier(exp) ? exp : t.numericLiteral(name);

    return { name: name, key: key };
  }

  function transformI18nMethod(node, file, props) {
    if (t.isCallExpression(node.tag)) {
      // Message with custom ID, where message is used as defaults
      // i18n.t('id')`Hello World`
      var defaults = node.tag.arguments[0];
      if (!t.isStringLiteral(defaults)) {
        throw file.buildCodeFrameError(node.tag, "Message ID must be a string");
      }
      var newProps = transformTemplateLiteral(node.quasi, file, props);
      return (0, _extends3.default)({}, newProps, {
        text: defaults.value,
        defaults: props.text
      });
    }

    return transformTemplateLiteral(node.quasi, file, props);
  }

  function transformChoiceMethod(node, file, props) {
    var root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var choices = {};
    var choicesType = node.callee.name.toLowerCase();
    var defaults = void 0;
    var variable = void 0;
    var offset = "";

    var choiceArguments = node.arguments[0];
    if (t.isStringLiteral(choiceArguments)) {
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

        var name = t.isNumericLiteral(key) ? "=" + key.value : key.name || key.value;

        if (name === "value") {
          var exp = attr.value;

          var _expressionToArgument = expressionToArgument(exp, props),
              _name = _expressionToArgument.name,
              _key = _expressionToArgument.key;

          variable = _name;
          props.values[_name] = t.objectProperty(_key, exp);
        } else if (choicesType !== "select" && name === "offset") {
          // offset is static parameter, so it must be either string or number
          if (!t.isNumericLiteral(attr.value) && !t.isStringLiteral(attr.value)) {
            throw file.buildCodeFrameError(node.callee, "Offset argument cannot be a variable.");
          }
          offset = " offset:" + attr.value.value;
        } else {
          var value = "";

          if (t.isTemplateLiteral(attr.value)) {
            props = transformTemplateLiteral(attr.value, file, (0, _extends3.default)({}, props, {
              text: ""
            }));
            value = props.text;
          } else if (t.isCallExpression(attr.value)) {
            props = transformMethod(attr.value, file, (0, _extends3.default)({}, props, { text: "" }));
            value = "{" + props.text + "}";
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

  function transformFormatMethod(node, file, props, root) {
    var exp = node.arguments[0];

    // missing value
    if (exp === undefined) {
      throw file.buildCodeFrameError(node.callee, "The first argument of format function must be a variable.");
    }

    var _expressionToArgument2 = expressionToArgument(exp, props),
        name = _expressionToArgument2.name,
        key = _expressionToArgument2.key;

    var type = node.callee.name;
    var parts = [name, // variable name
    type // format type
    ];

    var format = "";
    var formatArg = node.arguments[1];
    if (!formatArg) {
      // Do not throw validation error when format doesn't exist
    } else if (t.isStringLiteral(formatArg)) {
      format = formatArg.value;
    } else if (t.isIdentifier(formatArg) || t.isObjectExpression(formatArg)) {
      if (t.isIdentifier(formatArg)) {
        format = formatArg.name;
      } else {
        var formatName = new RegExp("^" + type + "\\d+$");
        var existing = (0, _keys2.default)(props.formats).filter(function (name) {
          return formatName.test(name);
        });
        format = "" + type + (existing.length || 0);
      }

      props.formats[format] = t.objectProperty(t.identifier(format), formatArg);
    } else {
      throw file.buildCodeFrameError(formatArg, "Format can be either string for buil-in formats, variable or object for custom defined formats.");
    }

    if (format) parts.push(format);

    props.values[name] = t.objectProperty(key, exp);
    props.text += "" + parts.join(",");

    return props;
  }

  function transformTemplateLiteral(exp, file, props) {
    var parts = [];

    exp.quasis.forEach(function (item, index) {
      parts.push(item);

      if (!item.tail) parts.push(exp.expressions[index]);
    });

    parts.forEach(function (item) {
      if (t.isTemplateElement(item)) {
        props.text += item.value.raw.replace(/\\`/g, "`");
      } else if (t.isCallExpression(item) && (isI18nMethod(item.callee) || isChoiceMethod(item.callee) || isFormatMethod(item.callee))) {
        var _transformMethod = transformMethod(item, file, (0, _extends3.default)({}, props, {
          text: ""
        })),
            text = _transformMethod.text;

        props.text += "{" + text + "}";
      } else {
        var _expressionToArgument3 = expressionToArgument(item, props),
            name = _expressionToArgument3.name,
            key = _expressionToArgument3.key;

        props.text += "{" + name + "}";
        props.values[name] = t.objectProperty(key, item);
      }
    });

    return props;
  }

  function transformMethod(node, file, props) {
    var root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    if (isI18nMethod(node)) {
      // t
      return transformI18nMethod(node, file, props);
    } else if (isChoiceMethod(node.callee)) {
      // plural, select and selectOrdinal
      return transformChoiceMethod(node, file, props, root);
    } else if (isFormatMethod(node.callee)) {
      // date, number
      return transformFormatMethod(node, file, props, root);
    }

    return props;
  }

  return function transform(path, file) {
    // 1. Collect all parameters and generate message ID
    var props = transformMethod(path.node, file, initialProps(), true);

    var text = props.text.replace(nlRe, " ").trim();
    if (!text) return;

    // 2. Create message descriptor
    var descriptorProps = [t.objectProperty(t.identifier("id"), t.StringLiteral(text))];

    if (props.defaults) {
      descriptorProps.push(t.objectProperty(t.identifier("defaults"), t.stringLiteral(props.defaults)));
    }

    var formatsList = (0, _values2.default)(props.formats);
    if (formatsList.length) {
      descriptorProps.push(t.objectProperty(t.identifier("formats"), t.objectExpression(formatsList)));
    }

    var valuesList = (0, _values2.default)(props.values);
    if (valuesList.length) {
      descriptorProps.push(t.objectProperty(t.identifier("values"), t.objectExpression(valuesList.length ? valuesList : [])));
    }

    var exp = t.objectExpression(descriptorProps);
    exp.loc = path.node.loc;
    path.replaceWith(exp);

    // 3. Add leading `i18n` comment (if doesn't exist) for lingui-extract
    var nodeWithComments = path.parentPath.type === "ExpressionStatement" ? path.parentPath.node : path.node;
    var i18nComment = nodeWithComments.leadingComments && nodeWithComments.leadingComments.filter(function (node) {
      return node.value.trim().substr(0, 4) === "i18n";
    })[0];

    if (!i18nComment) {
      path.addComment("leading", "i18n");
    }
  };
};

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
    formats: {},
    argumentGenerator: generatorFactory()
  };
};
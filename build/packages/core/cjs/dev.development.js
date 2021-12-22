'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _Object$getOwnPropertyNames = _interopDefault(require('babel-runtime/core-js/object/get-own-property-names'));
var _objectWithoutProperties = _interopDefault(require('babel-runtime/helpers/objectWithoutProperties'));
var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var messageformatParser = require('messageformat-parser');
var _slicedToArray = _interopDefault(require('babel-runtime/helpers/slicedToArray'));
var plurals = _interopDefault(require('make-plural/umd/plurals'));
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));

var isString = function isString(s) {
  return typeof s === "string";
};
var isFunction = function isFunction(f) {
  return typeof f === "function";
};
function isEmpty(obj) {
  // null and undefined are "empty"
  if (obj === null || obj === undefined) return true;

  if (obj.length > 0) return false;
  if (obj.length === 0) return true;

  return !_Object$getOwnPropertyNames(obj).length;
}

function date(locales) {
  var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var formatter = new Intl.DateTimeFormat(locales, format);
  return function (value) {
    if (isString(value)) value = new Date(value);
    return formatter.format(value);
  };
}

function number(locales) {
  var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var formatter = new Intl.NumberFormat(locales, format);
  return function (value) {
    return formatter.format(value);
  };
}

var defaultFormats = function defaultFormats(language, locales) {
  var languageData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var formats = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  locales = locales || language;
  var plurals$$1 = languageData.plurals;

  var style = function style(format) {
    return isString(format) ? formats[format] || { style: format } : format;
  };
  var replaceOctothorpe = function replaceOctothorpe(value, message) {
    return function (ctx) {
      var msg = isFunction(message) ? message(ctx) : message;
      var norm = Array.isArray(msg) ? msg : [msg];
      var formatter = new Intl.NumberFormat(locales);
      var valueStr = formatter.format(value);
      return norm.map(function (m) {
        return isString(m) ? m.replace("#", valueStr) : m;
      });
    };
  };

  return {
    plural: function plural(value, _ref) {
      var _ref$offset = _ref.offset,
          offset = _ref$offset === undefined ? 0 : _ref$offset,
          rules = _objectWithoutProperties(_ref, ["offset"]);

      var message = rules[value] || rules[plurals$$1(value - offset)];
      return replaceOctothorpe(value - offset, message);
    },

    selectordinal: function selectordinal(value, _ref2) {
      var _ref2$offset = _ref2.offset,
          offset = _ref2$offset === undefined ? 0 : _ref2$offset,
          rules = _objectWithoutProperties(_ref2, ["offset"]);

      var message = rules[value] || rules[plurals$$1(value - offset, true)];
      return replaceOctothorpe(value - offset, message);
    },

    select: function select(value, rules) {
      return rules[value] || rules.other;
    },

    number: function number$$1(value, format) {
      return number(locales, style(format))(value);
    },

    date: function date$$1(value, format) {
      return date(locales, style(format))(value);
    },

    undefined: function undefined(value) {
      return value;
    }
  };
};

// Params -> CTX
/**
 * Creates a context object, which formats ICU MessageFormat arguments based on
 * argument type.
 *
 * @param language     - Language of message
 * @param locales      - Locales to be used when formatting the numbers or dates
 * @param values       - Parameters for variable interpolation
 * @param languageData - Language data (e.g: plurals)
 * @param formats - Custom format styles
 * @returns {function(string, string, any)}
 */
function context(_ref3) {
  var language = _ref3.language,
      locales = _ref3.locales,
      values = _ref3.values,
      formats = _ref3.formats,
      languageData = _ref3.languageData;

  var formatters = defaultFormats(language, locales, languageData, formats);

  var ctx = function ctx(name, type, format) {
    var value = values[name];
    var formatted = formatters[type](value, format);
    var message = isFunction(formatted) ? formatted(ctx) : formatted;
    return Array.isArray(message) ? message.join("") : message;
  };

  return ctx;
}

function interpolate(translation, language, locales, languageData) {
  return function (values) {
    var formats = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var message = translation(context({
      language: language,
      locales: locales,
      languageData: languageData,
      formats: formats,
      values: values
    }));

    return Array.isArray(message) ? message.join("").trim() : message;
  };
}

var flatten = function flatten(arrays) {
  return [].concat.apply([], arrays);
};
var zip = function zip(a, b) {
  return a.map(function (item, index) {
    return [item, b[index]];
  });
};

var t = function t(strings) {
  for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  return flatten(zip(strings, values)).join("");
};

var _plural = function _plural(type) {
  return function (i18n) {
    return function (_ref) {
      var value = _ref.value,
          _ref$offset = _ref.offset,
          offset = _ref$offset === undefined ? 0 : _ref$offset,
          locales = _ref.locales,
          format = _ref.format,
          other = _ref.other,
          pluralForms = _objectWithoutProperties(_ref, ["value", "offset", "locales", "format", "other"]);

      if (locales === undefined) locales = i18n.locales || i18n.language;

      var diff = value - offset;
      var diffAsString = number(locales, format)(diff);
      var translation = pluralForms[value.toString()] || // exact match
      pluralForms[i18n.pluralForm(diff, type)] || // plural form
      other; // fallback
      return translation.replace("#", diffAsString);
    };
  };
};

var plural = _plural("cardinal");
var selectOrdinal = _plural("ordinal");

function select(_ref2) {
  var value = _ref2.value,
      other = _ref2.other,
      selectForms = _objectWithoutProperties(_ref2, ["value", "other"]);

  return selectForms[value] || other;
}

// [Tokens] -> (CTX -> String)
function processTokens(tokens) {
  var octothorpe = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!tokens.filter(function (token) {
    return !isString(token);
  }).length) {
    return tokens.join("");
  }

  return function (ctx) {
    return tokens.map(function (token) {
      if (isString(token)) {
        return token;

        // # in plural case
      } else if (token.type === "octothorpe") {
        var name = octothorpe.name,
            _octothorpe$offset = octothorpe.offset,
            _offset = _octothorpe$offset === undefined ? 0 : _octothorpe$offset;

        return ctx(name) - _offset;

        // simple argument
      } else if (token.type === "argument") {
        return ctx(token.arg);

        // argument with custom format (date, number)
      } else if (token.type === "function") {
        return ctx(token.arg, token.key, token.params[0]);
      }

      var offset = token.offset ? parseInt(token.offset) : undefined;

      // complex argument with cases
      var formatProps = {};
      token.cases.forEach(function (item) {
        formatProps[item.key] = processTokens(item.tokens, {
          name: token.arg,
          offset: offset
        });
      });

      return ctx(token.arg, token.type, _extends({
        offset: offset
      }, formatProps));
    });
  };
}

// Message -> (Params -> String)
function compile(message) {
  try {
    return processTokens(messageformatParser.parse(message));
  } catch (e) {
    console.error("Message cannot be parsed due to syntax errors: " + message);
    return message;
  }
}

var loadLanguageData = (function (locale) {
  if (!locale) {
    return;
  }

  var _locale$split = locale.split(/[_-]/),
      _locale$split2 = _slicedToArray(_locale$split, 1),
      language = _locale$split2[0];

  return { plurals: plurals[language] };
});



var dev = /*#__PURE__*/Object.freeze({
  compile: compile,
  loadLanguageData: loadLanguageData
});

function getLanguageData(catalog) {
  return (catalog || {}).languageData || {};
}

function getMessages(catalog) {
  return (catalog || {}).messages || {};
}

var I18n = function () {
  function I18n() {
    _classCallCheck(this, I18n);

    // Messages and languageData are merged on load,
    // so we must initialize it manually
    this._activeMessages = {};
    this._catalogs = {};

    {
      this.t = t;
      this.select = select;
      this.plural = plural(this);
      this.selectOrdinal = selectOrdinal(this);
    }
  }

  // Messages/language data in active language.
  // This is optimization, so we don't perform object lookup
  // _catalogs[language] for each translation.


  // Message catalogs


  _createClass(I18n, [{
    key: "_cacheActiveLanguage",
    value: function _cacheActiveLanguage() {
      var activeCatalog = this._catalogs[this.language];

      var languageData = getLanguageData(activeCatalog);
      {
        // Allow overriding data in development, useful for testing
        if (isEmpty(languageData) && this._dev && isFunction(this._dev.loadLanguageData)) {
          languageData = this._dev.loadLanguageData(this.language);
        }
      }

      this._activeMessages = getMessages(activeCatalog);
      this._activeLanguageData = languageData;
    }
  }, {
    key: "load",
    value: function load(catalogs) {
      var _this = this;

      if ((typeof catalogs === "undefined" ? "undefined" : _typeof(catalogs)) !== "object") return;

      // deeply merge Catalogs
      _Object$keys(_extends({}, this._catalogs, catalogs)).forEach(function (language) {
        var compiledMessages = getMessages(catalogs[language]);

        {
          if (_this._dev && isFunction(_this._dev.compile)) {
            compiledMessages = _Object$keys(compiledMessages).reduce(function (dict, id) {
              var msg = compiledMessages[id];
              dict[id] = isString(msg) ? _this._dev.compile(msg) : msg;
              return dict;
            }, {});
          }
        }

        _this._catalogs[language] = {
          messages: _extends({}, getMessages(_this._catalogs[language]), compiledMessages),
          languageData: _extends({}, getLanguageData(_this._catalogs[language]), getLanguageData(catalogs[language]))
        };
      });

      this._cacheActiveLanguage();
    }
  }, {
    key: "activate",
    value: function activate(language, locales) {
      if (!language) return;

      {
        if (this.availableLanguages.indexOf(language) === -1) {
          console.warn("Message catalog for locale \"" + language + "\" not loaded.");
        }
      }

      this._language = language;
      this._locales = locales;
      this._cacheActiveLanguage();
    }
  }, {
    key: "use",
    value: function use(language, locales) {
      return setupI18n({
        language: language,
        locales: locales,
        catalogs: this._catalogs,
        development: this._dev
      });
    }

    // default translate method

  }, {
    key: "_",
    value: function _(id) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          defaults = _ref.defaults,
          _ref$formats = _ref.formats,
          formats = _ref$formats === undefined ? {} : _ref$formats;

      // Expand message descriptor
      if (id && (typeof id === "undefined" ? "undefined" : _typeof(id)) === "object") {
        values = id.values;
        defaults = id.defaults;
        formats = id.formats;
        id = id.id;
      }

      var translation = this.messages[id] || defaults || id;

      // replace missing messages with custom message for debugging
      var missing = this._missing;
      if (missing && !this.messages[id]) {
        translation = isFunction(missing) ? missing(this.language, id) : missing;
      }

      {
        if (isString(translation) && this._dev && isFunction(this._dev.compile)) {
          translation = this._dev.compile(translation);
        }
      }

      if (!isFunction(translation)) return translation;
      return interpolate(translation, this.language, this.locales, this.languageData)(values, formats);
    }
  }, {
    key: "pluralForm",
    value: function pluralForm(n) {
      var pluralType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "cardinal";

      if (!this.languageData.plurals) return "other";
      return this.languageData.plurals(n, pluralType === "ordinal");
    }
  }, {
    key: "date",
    value: function date$$1(value, format) {
      return date(this.locales || this.language, format)(value);
    }
  }, {
    key: "number",
    value: function number$$1(value, format) {
      return number(this.locales || this.language, format)(value);
    }
  }, {
    key: "availableLanguages",
    get: function get() {
      return _Object$keys(this._catalogs);
    }
  }, {
    key: "language",
    get: function get() {
      return this._language;
    }
  }, {
    key: "locales",
    get: function get() {
      return this._locales;
    }
  }, {
    key: "messages",
    get: function get() {
      return this._activeMessages;
    }
  }, {
    key: "languageData",
    get: function get() {
      return this._activeLanguageData;
    }
  }]);

  return I18n;
}();

function setupI18n() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var i18n = new I18n();

  {
    i18n._dev = dev;
  }

  if (params.catalogs) i18n.load(params.catalogs);
  if (params.language) i18n.activate(params.language, params.locales);
  if (params.missing) i18n._missing = params.missing;

  return i18n;
}

var i18n = setupI18n();

var i18nMark = function i18nMark(id) {
  return id;
};

exports.i18nMark = i18nMark;
exports.i18n = i18n;
exports.setupI18n = setupI18n;
exports.date = date;
exports.number = number;

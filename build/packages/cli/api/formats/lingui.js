"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _ramda = require("ramda");

var R = _interopRequireWildcard(_ramda);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var removeOrigins = R.map(function (_ref) {
  var origin = _ref.origin,
      message = (0, _objectWithoutProperties3.default)(_ref, ["origin"]);
  return message;
});

var format = {
  filename: "messages.json",

  write: function write(filename, catalog) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var outputCatalog = catalog;
    if (options.origins === false) {
      outputCatalog = removeOrigins(catalog);
    }
    _fs2.default.writeFileSync(filename, (0, _stringify2.default)(outputCatalog, null, 2));
  },
  read: function read(filename) {
    var raw = _fs2.default.readFileSync(filename).toString();

    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Cannot read " + filename + ": " + e.message);
      return null;
    }
  }
};

exports.default = format;
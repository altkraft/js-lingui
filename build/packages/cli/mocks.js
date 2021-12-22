"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

exports.mockConfig = mockConfig;
exports.mockConsole = mockConsole;

var _conf = require("@lingui/conf");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mockConfig() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return (0, _extends3.default)({}, _conf.defaultConfig, config);
}
function mockConsole(testCase) {
  var mock = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  function restoreConsole() {
    global.console = originalConsole;
  }

  var originalConsole = global.console;

  var defaults = {
    log: jest.fn(),
    warn: jest.fn()
  };

  global.console = (0, _extends3.default)({}, defaults, mock);

  var result = void 0;
  try {
    result = testCase(global.console);
  } catch (e) {
    restoreConsole();
    throw e;
  }

  if (result && typeof result.then === "function") {
    return result.then(restoreConsole).catch(restoreConsole);
  } else {
    restoreConsole();
    return result;
  }
}
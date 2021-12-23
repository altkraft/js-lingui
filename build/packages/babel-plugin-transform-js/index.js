"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (babel) {
  var t = babel.types;


  var transformer = new _transformer2.default(babel);

  return {
    visitor: {
      CallExpression: transformer.transform,
      TaggedTemplateExpression: transformer.transform
    }
  };
};

var _transformer = require("./transformer");

var _transformer2 = _interopRequireDefault(_transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
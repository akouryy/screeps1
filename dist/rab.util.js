"use strict";
const LG = require('wrap.log');

module.exports = {
  safely(f) {
    try {
      return f();
    } catch(err) {
      console.log(LG.color('red', `${err}\n${err.stack}`));
      return this.error(err);
    }
  },
  error(error) {
    return {
      isError: true,
      error,
    };
  },
};

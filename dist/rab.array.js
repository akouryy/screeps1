"use strict";
const c = require('consts');

module.exports = {
    sample: arr => arr[0 | Math.random() * arr.length],

    sampleFixed: (arr, str) => {
        if(arr.length === 0) return undefined;

        let hash = 0;
        for(let i = 0; i < str.length; i++) {
            const chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return arr[hash % arr.length];
    },

    cycleGet: (arr, idx) => arr[idx % arr.length],

    balance(expected, actual) {
      const x = _.isArray(expected) ?
        _.countBy(expected) :
        expected;
      const a = _.isArray(actual) ?
        _.countBy(actual) :
        actual;
      const ret = _.min(_.shuffle(_.keys(x)), k => x[k] ? (a[k] || 0) / x[k] : 1e30);
      const retNum = Number(ret);
      return Number.isNaN(retNum) ? ret : retNum;
    },

    mapObj(arr, fn) {
      return Object.assign({}, ...arr.map(el => fn(el)));
    },
};

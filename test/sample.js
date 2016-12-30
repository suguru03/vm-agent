'use strict';

const assert = require('assert');
const test1 = 'const test1';
let test2 =  'let test2';var test3 = 'var test3';

function test() {
  const test1 = 'inner const test1';
  let test2 =  'inner let test2';
  var test3 = 'inner var test3';
}

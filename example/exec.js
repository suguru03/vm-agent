'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { Agent } = require('../');

const filepath = path.resolve(__dirname, 'sample.js');
const file = fs.readFileSync(filepath, 'utf8');

const context = {};
vm.runInNewContext(file, context);
console.log(context);
/*
 * { test3: 'test3',
 *   test: [Function: test] } // let, constが取得できない
 */

const result1 = new Agent(file)
  .run()
  .getInnerVariable();

console.log(result1);
/*
 * { test1: 'test1',
 *   test2: 'test2',
 *   test3: 'test3',
 *   test: [Function: test] }
 */

const result2 = new Agent(result1.test)
  .setArguments(4, 5, 6)
  .run()
  .getInnerVariable();

console.log(result2);
/*
 * { arg1: 4,
 *   arg2: 5,
 *   arg3: 6,
 *   sum: 15,
 *   num1: 1,
 *   num2: 2,
 *   num3: 3 }
 */

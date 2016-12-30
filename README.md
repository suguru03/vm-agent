# vm-agent

This library is node vm wrapper, it is able to get all inner variables.

## Usage

https://gist.github.com/suguru03/a07a9f9eebc27b66542e319736ed45dd

```js
// sample.js
const test1 = 'test1';
let test2 = 'test2';
var test3 = 'test3';

function test(arg1, arg2, arg3) {
  const sum = arg1 + arg2 + arg3;
  let num1 = 1;
  var num2 = 2;
  num3 = 3;
  return sum + num1 + num2 + num3;
}
```

```js
// exec.js
const fs = require('fs');
const path = require('path');

const filepath = path.resolve(__dirname, 'sample.js');
const code = fs.readFileSync(filepath, 'utf8');

const { Agent } = require('vm-agent');
const result1 = new Agent(code).run().getInnerVariable();
/**
 * get all variables
 *
 * { test1: 'test1',
 *   test2: 'test2',
 *   test3: 'test3',
 *   test: [Function: test] }
 */

const result2 = new Agent(result1.test).setArguments(4, 5, 6).run().getInnerVariable();
/**
 * get inner variables of function
 *
 * { arg1: 4,
 *   arg2: 5,
 *   arg3: 6,
 *   sum: 15,
 *   num1: 1,
 *   num2: 2,
 *   num3: 3 }
 */
```


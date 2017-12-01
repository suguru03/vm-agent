# vm-agent

The library is vm module wrapper, it is supposed to be used for testing inner variables or hacking scripts. It is not for production.

It supports executing scripts, functions by filepath or functions.
Also, it will be able to access inner variables.

## Usage

```
$ npm i -D vm-agent
```

If you want to run a script using vm, you need to set a filepath and call `run`. The context is resolved automatically.

```
const agent = new Agent(<filepath>).run();
```

After that, if you wanna get inner variables, you need to call `getInnerVariables`.

```
const innerVariables = agent.getInnerVariables();
```

### Function

```js
const { Agent } = require('vm-agent');
const func = (arg1, arg2, arg3) => {
  const num1 = 1;
  const num2 = 2;
  const num3 = 3;
  const sum = arg1 + arg2 + arg3 + num1 + num2 + num3;
  return sum;
};
const result = new Agent(func).setArguments(4, 5, 6).run().getInnerVariable();
console.log(result);
/**
 * { arg1: 4,
 *   arg2: 5,
 *   arg3: 6,
 *   num1: 1,
 *   num2: 2,
 *   num3: 3,
 *   sum: 21 }
 */
```

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

// exec.js
const fs = require('fs');
const path = require('path');

const filepath = path.resolve(__dirname, 'sample.js');
const code = fs.readFileSync(filepath, 'utf8');

const { Agent } = require('vm-agent');
const result1 = new Agent(filepath).run().getInnerVariable();
// or
const result1 = new Agent(code).run().getInnerVariable();
console.log(result1);
/**
 * get all variables
 *
 * { test1: 'test1',
 *   test2: 'test2',
 *   test3: 'test3',
 *   test: [Function: test] }
 */

const result2 = new Agent(result1.test).setArguments(4, 5, 6).run().getInnerVariable();
console.log(result2);
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

### Async/Await

```js
const { Agent } = require('vm-agent');

```

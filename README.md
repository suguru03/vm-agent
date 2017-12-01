# vm-agent

The library is vm module wrapper, it is supposed to be used for testing inner variables or hacking scripts. It is not for production.

It supports executing scripts, functions by filepath or functions.
Also, it will be able to access inner variables.

## Usage

```sh
$ npm i -D vm-agent
```

If you want to run a script using vm, you need to set a filepath and call `run`. The context is resolved automatically.

```js
const { Agent } = require('vm-agent');
const agent = new Agent(<filepath>).run();
// or
const exec = require('vm-agent');
const agent = exec(<filepath>);
```

If the script is an async function, you need to call `runAsync` function.

```js
const agent = new Agent(<filepath>).runAsync();
```

After that, if you wanna get inner variables, you need to call `getInnerVariable` or `getValue`.

```js
const innerVariables = agent.getInnerVariable();
// or
const innerVariables = agent.getValue();
```

## Examples

### Inner functions

```js
function func1() {
  console.log('func1 is called');
  function func2() {
    console.log('func2 is called');
  }
}
exec(func1)
  .getInnerVariable()
  .func2();
```

### Async/Await

```js
async function func1() {
  const util = require('util');
  const delay = util.promisify(setTimeout);
  await delay(100);
  console.log('func1 is called');
  async function func2() {
    await delay(100);
    console.log('func2 is called');
  }
}

async function execute() {
  const agent = await new Agent(func1).runAsync();
  const { func2 } = agent.getInnerVariable();
  await new Agent(func2, agent.getContext()).runAsync();
}

execute();
```

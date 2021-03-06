'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

const basicpath = path.resolve(__dirname, 'sample', 'basic.js');
const asyncpath = path.resolve(__dirname, 'sample', 'async.js');
const code = fs.readFileSync(basicpath, 'utf8');

const agent = require('../');
const { Agent, runInNewContext } = agent;
const delay = util.promisify(setTimeout);

describe('#Agent', () => {

  it('should run and get inner variable', () => {
    const agent = new Agent(code);
    const variable = agent.run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['test', 'assert', 'test1', 'test2', 'test3']);
    assert.strictEqual(variable.test1, 'const test1');
  });

  it('should get inner variable of function', () => {
    function test() {
      const test1 = 'inner const test1';
      let test2 =  'inner let test2';
      var test3 = 'inner var test3';
      return test1 + test2 + test3;
    }
    const agent = new Agent(test);
    const variable = agent.run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['test1', 'test2', 'test3']);
  });

  it('should get inner variable of function', () => {
    function test(arg1, arg2, arg3) {
      const sum = arg1 + arg2 + arg3;
      const test1 = 'inner const test1';
      let test2 =  'inner let test2';
      var test3 = 'inner var test3';
      return sum + test1 + test2 + test3;
    }
    const agent = new Agent(test);
    const variable = agent.setArguments(1, 2, 3).run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['arg1', 'arg2', 'arg3', 'sum', 'test1', 'test2', 'test3']);
    assert.strictEqual(variable.arg1, 1);
    assert.strictEqual(variable.arg2, 2);
    assert.strictEqual(variable.arg3, 3);
    assert.strictEqual(variable.sum, 6);
  });

  it('should get inner variable of arrow function', () => {
    const test = (arg1, arg2, arg3) => {
      const sum = arg1 + arg2 + arg3;
      const test1 = 'inner const test1';
      let test2 =  'inner let test2';
      var test3 = 'inner var test3';
      return sum + test1 + test2 + test3;
    };
    const agent = new Agent(test);
    const variable = agent.setArguments(1, 2, 3, 4).run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['arg1', 'arg2', 'arg3', 'sum', 'test1', 'test2', 'test3']);
    assert.strictEqual(variable.arg1, 1);
    assert.strictEqual(variable.arg2, 2);
    assert.strictEqual(variable.arg3, 3);
    assert.strictEqual(variable.sum, 6);
  });

  it('should run inner function and get inner variable', () => {
    const { test } = new Agent(code).run().getInnerVariable();
    assert.strictEqual(typeof test, 'function');
    const variable = new Agent(test).run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['test1', 'test2', 'test3']);
  });

  it('should get inner variable with complex function', () => {
    function test(arg1, arg2, arg3) {
      const sum = (() => arg1 + arg2 + arg3);
      const sum1 = (function sum(arg1, arg2) {
        return arg1 + arg2;
      })(arg1, arg3);
      return sum + sum1;
    }
    const variable = new Agent(test).setArguments(3, 1, 2).run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['arg1', 'arg2', 'arg3', 'sum', 'sum1']);
    assert.strictEqual(variable.sum1, 5);
  });

  it('should work with an array argument', () => {
    function test(arr) {
      const sum = arr.reduce((sum, n) => sum + n);
      return sum;
    }
    const variable = new Agent(test).setArguments([1, 2, 3]).run().getInnerVariable();
    assert.strictEqual(variable.sum, 6);
  });

  it('should work with an array of strings', () => {
    function test(arr) {
      const str = arr.reduce((sum, n) => sum + n);
      return str;
    }
    const variable = new Agent(test).setArguments(['a', 'b', 'c']).run().getInnerVariable();
    assert.strictEqual(variable.str, 'abc');
  });

  it('should work with a async arrow function', () => {
    const variable = new Agent(asyncpath).run().getInnerVariable();
    assert.ok(variable);
    assert.deepEqual(Object.keys(variable), ['result']);
  });

  it('should work async function with context', async () => {
    const fn = async () => {
      await delay(100);
      const a = [1, 2, 3];
      const b = 2;
      function callSync() {
        const s = 4;
        return s;
      }
      async function callAsync() {
        await delay(100);
        const c = 3;
        return c;
      }
      const d = await callAsync();
      const e = callSync();
      return a + b + d + e;
    };
    const context = { delay };
    const agent = await new Agent(fn, context).runAsync();
    const variable = agent.getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepStrictEqual(keys, ['delay', 'a', 'b', 'callSync', 'callAsync', 'd', 'e']);
  });

  it('should work destructuring with async/await', async () => {
    const fn = async () => {
      await delay(100);
      async function getArray() {
        return [1, 2, 3];
      }
      async function getObj() {
        return {
          a: 1,
          b: 2,
          c: 3
        };
      }
      const sum = ({ a, b, c }) => a + b + c;
      const [a, b] = await getArray();
      const [
        c,
        d
      ] = await getArray();
      const {
        e, f
      } = await getObj();
      const s = sum(await getObj());
      return a + b + c + c + d + e + f + s;
    };
    const context = { delay };
    const agent = await new Agent(fn, context).runAsync();
    const variable = agent.getInnerVariable();
    const keys = Object.keys(variable);
    // TODO assign destructued variables
    assert.deepStrictEqual(keys, ['delay', 'getArray', 'getObj', 'sum', 's']);
  });

  it('should work with async/await', async () => {
    async function func1() {
      const util = require('util');
      const delay = util.promisify(setTimeout);
      await delay(100);
      async function func2() { // eslint-disable-line
        await delay(100);
      }
    }
    const agent = await new Agent(func1).runAsync();
    const data = agent.getInnerVariable();
    assert.deepStrictEqual(Object.keys(data), ['delay', 'func2']); // util is reserved
    await new Agent(data.func2, agent.getContext()).runAsync();
  });

  it('should get the extended array', () => {
    const code = 'const array = []';
    const { array } = new Agent(code).run().getInnerVariable();
    assert.ok(array instanceof Array);
  });

  it('should get the extended TypeError', () => {
    const code = 'const array = array.b.c';
    try {
      new Agent(code).run();
    } catch (e) {
      assert.ok(e instanceof Error);
      assert.ok(e instanceof TypeError);
    }
  });

  it('should have the global', () => {
    const code = 'const array = new global.Array()';
    const { array } = new Agent(code).run().getInnerVariable();
    assert.ok(array instanceof Array);
  });
});

describe('#runInNewContext', () => {

  it('should run and get inner variable', () => {
    const context = { require };
    const agent = runInNewContext(code, context);
    assert.ok(agent instanceof Agent);
    assert.ok(context.test1);
    assert.ok(context.test2);
    assert.ok(context.test3);
    assert.ok(context.test);
  });
});

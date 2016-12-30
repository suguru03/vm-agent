'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const filepath = path.resolve(__dirname, 'sample.js');
const code = fs.readFileSync(filepath, 'utf8');

const agent = require('../');
const { Agent, runInNewContext } = agent;

describe('#Agent', () => {

  it('should run and get inner variable', () => {
    const agent = new Agent(code);
    const variable = agent.run().getInnerVariable();
    const keys = Object.keys(variable);
    assert.deepEqual(keys, ['assert', 'test1', 'test2', 'test3', 'test']);
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

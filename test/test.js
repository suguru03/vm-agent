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

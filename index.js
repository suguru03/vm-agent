'use strict';

const vm = require('vm');
const _ = require('lodash');
const esprima = require('esprima');
const escodegen = require('escodegen');

class Agent {
  constructor(code, context) {
    this._code = code;
    this._context = context;
    this._result = undefined;
  }
  setCode(code) {
    this._code = code;
    return this;
  }
  setContext(context) {
    this._context = context;
    return this;
  }
  run() {
    const code = generateCode(this._code);
    const context = resolveContext(this._context);
    const result = vm.runInNewContext(code, context);
    this._result = result;
    return this;
  }
  getResult() {
    return this._result;
  }
  getContext() {
    return this._context;
  }
  getInnerVariable() {
    return _.omit(this._context, (value, key) => global[key]);
  }
}

function generateCode(code) {
  const parts = esprima.parse(code);
  resolveAST(parts);
  return escodegen.generate(parts);
}

function resolveAST(part) {
  if (_.isArray(part)) {
    return _.forEach(part, resolveAST);
  }
  if (part.body) {
    return resolveAST(part.body);
  }
  switch (part.type) {
  case 'VariableDeclaration':
    part.kind = 'var';
    break;
  }
}

function resolveContext(context) {
  context = context || global;
  context.require = require;
  return context;
}

function runInThisContext(code) {
  return runInNewContext(code, this);
}

function runInNewContext(code, context) {
  return new Agent(code, context).run();
}

function run(code, context) {
  return runInNewContext(code, context);
}

run.run = run;
run.runInThisContext = runInThisContext;
run.runInNewContext = runInNewContext;
run.Agent = Agent;

module.exports = run;

'use strict';

const vm = require('vm');
const esprima = require('esprima');
const escodegen = require('escodegen');
const globalKeyMap = Object.keys(global).reduce((result, key) => {
  result[key] = key;
  return result;
}, { require });

class Agent {
  constructor(code, context) {
    this._code = code;
    this._context = resolveContext(context);
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
    const context = this._context;
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
    return Object.keys(this._context).reduce((result, key) => {
      if (!globalKeyMap[key]) {
        result[key] = this._context[key];
      }
      return result;
    }, {});
  }
}

function generateCode(code) {
  const parts = esprima.parse(code);
  resolveAST(parts);
  return escodegen.generate(parts);
}

function resolveAST(part) {
  if (Array.isArray(part)) {
    return part.forEach(resolveAST);
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

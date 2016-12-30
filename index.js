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
    this._args = [];
    this._context = resolveContext(context);
    this._result = undefined;
  }
  setCode(code) {
    this._code = code;
    return this;
  }
  setArguments() {
    let l = arguments.length;
    if (!l) {
      return this;
    }
    const args = Array(l);
    while (l--) {
      args[l] = arguments[l];
    }
    this._args = args;
    return this;
  }
  setContext(context) {
    this._context = resolveContext(context);
    return this;
  }
  run() {
    const code = generateCode(this._code, this._args);
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

function generateCode(code, args) {
  const isFunc = typeof code === 'function';
  code = isFunc ? code.toString() : code;
  const parts = esprima.parse(code);
  resolveAST(parts);
  code = escodegen.generate(parts);
  return isFunc ? resolveFunction(code, args) : code;
}

const FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /(=.+)?(\s*)$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * parse function arguments for `autoInject`
 *
 * @private
 */
function parseArgs(code) {
  code = code.replace(STRIP_COMMENTS, '');
  code = code.match(FN_ARGS)[2].replace(' ', '');
  code = code ? code.split(FN_ARG_SPLIT) : [];
  return code.map(arg => arg.replace(FN_ARG, '').trim());
}

function makeVariable(func, args) {
  const argKeys = parseArgs(func);
  return argKeys.reduce((result, key, index) => {
    return `${result}var ${key} = ${args[index]};\n`;
  }, '');
}

function resolveFunction(code, args) {
  const variable = makeVariable(code, args);
  const str = code.trim()
    .replace(/(.*)\{/, variable)
    .replace(/return(.*);/, '')
    .replace(/}$/, '');
  return str;
}

function resolveAST(part) {
  if (Array.isArray(part)) {
    return part.forEach(resolveAST);
  }
  const obj = part.body || part.expression || part.callee;
  if (obj) {
    return resolveAST(obj);
  }
  switch (part.type) {
  case 'VariableDeclaration':
    part.kind = 'var';
    break;
  }
}

function resolveContext(context) {
  context = context || global;
  context = context === global ? Object.assign({}, global) : context;
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

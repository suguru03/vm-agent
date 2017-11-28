'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const esprima = require('esprima');
const escodegen = require('escodegen');

const globalKeyMap = Object.keys(global).reduce((result, key) => {
  result[key] = key;
  return result;
}, { require, exports, __dirname });

const FN_ARGS = /^(function)?\s*[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /(=.+)?(\s*)$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

class Agent {
  constructor(code, context) {
    this._filepath = /^\/(.*).js$/.test(code) ? code : '';
    this._code = this._filepath ? fs.readFileSync(code, 'utf8') : code;
    this._completed = false;
    this._args = [];
    this._context = resolveContext(context, this._filepath);
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
    this._result = vm.runInNewContext(code, context);
    this._completed = !this._result || this._result.toString() !== '[object Promise]';
    if (!this._completed) {
      this._result.then(res => {
        this._completed = true;
        this._result = res;
      });
    }
    return this;
  }
  getResult() {
    return this._result;
  }
  getContext() {
    return this._context;
  }
  getInnerVariable() {
    if (!this._completed) {
      return returnActualInnerVariable(this);
    }
    return Object.keys(this._context).reduce((result, key) => {
      if (key === 'module') {
        const { exports } = this._context[key];
        if (exports !== run) {
          result[key] = { exports };
        }
        return result;
      }
      if (!globalKeyMap[key]) {
        result[key] = this._context[key];
      }
      return result;
    }, {});
  }
}

async function returnActualInnerVariable(agent) {
  await agent._result;
  agent._completed = true;
  return agent.getInnerVariable();
}

function generateCode(code, args) {
  const isFunc = typeof code === 'function';
  code = isFunc ? code.toString() : code;
  const parts = esprima.parse(code);
  resolveAST(parts);
  code = escodegen.generate(parts);
  return isFunc ? resolveFunction(code, args) : code;
}

function parseArgs(code) {
  code = code.replace(STRIP_COMMENTS, '');
  code = code.match(FN_ARGS)[2].replace(' ', '');
  code = code ? code.split(FN_ARG_SPLIT) : [];
  return code.map(arg => arg.replace(FN_ARG, '').trim());
}

function makeVariable(func, args) {
  return parseArgs(func)
    .reduce((str, key, i) => `${str}var ${key} = ${args[i]};\n`, '');
}

function resolveFunction(code, args) {
  const variable = makeVariable(code, args);
  let str = code
    .replace(/^.*\{/, variable)
    .replace(/\}?;?$/, '')
    .trim()
    .replace(/return.*;?$/, '') // TODO get the value
    .trim();

  if (/^async\s/.test(code)) {
    str = str
      .replace(/(\n\s{4})var\s/g, '$1this.')
      .replace(/(async)?\s?function\s(.+)\(/g, 'this.$2 = $2;$1 function $2(');
    str = `(async () => { ${str}})();`;
  }
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
  if (part.type === 'VariableDeclaration') {
    part.kind = 'var';
  }
}

function resolveContext(context, filepath) {
  const re = /(Error|\/vm-agent\/index.js)/;
  const trace = new Error().stack.split('\n').find(str => !re.test(str));
  const parts = trace.match(/\/(.*)\//g)[0].split('/');
  let dirpath;
  while (!dirpath && parts.length) {
    const dp = parts.join('/');
    const pp = path.resolve(dp, 'package.json');
    if (fs.existsSync(pp)) {
      dirpath = dp;
    }
    parts.pop();
  }
  const diraname = filepath ? path.resolve(filepath, '..') : dirpath;
  context = context || global;
  context = context === global ? Object.assign({}, global) : context;
  context.__dirname = diraname;
  context.module = module;
  context.exports = module.exports;
  context.require = !dirpath ? require : p => {
    let fp;
    if (/^\./.test(p)) {
      fp = path.resolve(filepath || dirpath, filepath ? '..' : '', p);
    } else {
      fp = path.resolve(dirpath, 'node_modules', p);
    }
    try {
      return require(fp);
    } catch (e) {
      return require(p);
    }
  };
  return context;
}

function runInThisContext(code) {
  return runInNewContext(code, this);
}

function runInNewContext(code, context) {
  return new Agent(code, context).run();
}

function run(code) {
  const agent = new Agent(code);
  let l = arguments.length;
  if (l > 1) {
    const args = Array(--l);
    while (l--) {
      args[l] = arguments[l + 1];
    }
    agent.setArguments.apply(agent, args);
  }
  return agent.run();
}

run.run = run;
run.runInThisContext = runInThisContext;
run.runInNewContext = runInNewContext;
run.Agent = Agent;

module.exports = run;

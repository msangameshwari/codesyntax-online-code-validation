import { fileURLToPath } from 'node:url';
import { Language, Parser } from 'web-tree-sitter';
import { wasmURL } from '@2h2d/tree-sitter-wasms';

const grammarNames = { python: 'python', c: 'c', cpp: 'cpp', java: 'java', csharp: 'csharp', go: 'go' };
let runtimePromise;
const languages = new Map();

async function getLanguage(language) {
  runtimePromise ??= Parser.init();
  await runtimePromise;
  if (!languages.has(language)) {
    const grammar = grammarNames[language];
    if (!grammar) throw new Error(`Tree-sitter grammar is not registered for ${language}`);
    languages.set(language, Language.load(fileURLToPath(wasmURL(grammar))));
  }
  return languages.get(language);
}

function treeToAst(node, budget, depth = 0) {
  if (budget.remaining-- <= 0) return { type: 'truncated' };
  const result = { type: node.type };
  if (node.isNamed && node.childCount === 0 && node.text.length <= 80) result.value = node.text;
  if (depth >= 14) {
    if (node.childCount) result.truncated = true;
    return result;
  }
  const children = [];
  for (let i = 0; i < node.childCount && budget.remaining > 0; i++) {
    const child = node.child(i);
    if (child?.isNamed) children.push(treeToAst(child, budget, depth + 1));
  }
  if (children.length) result.children = children;
  if (node.childCount && budget.remaining <= 0) result.truncated = true;
  return result;
}

export async function parseTreeSitter(language, source) {
  const grammar = await getLanguage(language);
  const parser = new Parser();
  parser.setLanguage(grammar);
  let tree;
  try {
    tree = parser.parse(source);
    const errors = [];
    const stack = [tree.rootNode];
    while (stack.length && errors.length < 20) {
      const node = stack.pop();
      if (node.isError || node.isMissing) {
        errors.push({
          message: node.isMissing ? `Expected ${node.type}` : `Unexpected syntax near “${node.text.slice(0, 100)}”`,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
        });
        continue;
      }
      for (let i = node.childCount - 1; i >= 0; i--) {
        const child = node.child(i);
        if (child?.hasError || child?.isError || child?.isMissing) stack.push(child);
      }
    }
    if (tree.rootNode.hasError && errors.length === 0) {
      errors.push({ message: 'Syntax error detected by the grammar parser', line: 1, column: 1 });
    }
    return {
      errors,
      ast: treeToAst(tree.rootNode, { remaining: 500 }),
      engine: `Tree-sitter ${language} grammar (WASM)`,
    };
  } finally {
    tree?.delete();
    parser.delete();
  }
}

export async function checkTreeSitterGrammars() {
  const result = {};
  for (const name of Object.keys(grammarNames)) {
    try {
      await getLanguage(name);
      result[name] = { supported: true, engine: `Tree-sitter ${name} grammar (WASM)` };
    } catch (error) {
      result[name] = { supported: false, engine: null, error: error.message };
    }
  }
  return result;
}

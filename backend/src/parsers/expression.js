function tokenize(input) {
  const tokens = []; let i = 0, line = 1, column = 1;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) { if (ch === '\n') { line++; column = 1; } else column++; i++; continue; }
    const start = { line, column };
    if (/[0-9]/.test(ch)) { let text = ''; while (i < input.length && /[0-9.]/.test(input[i])) { text += input[i++]; column++; } if ((text.match(/\./g) || []).length > 1) throw Object.assign(new Error('Malformed numeric literal'), start); tokens.push({ type: 'number', value: Number(text), text, ...start }); continue; }
    if (/[A-Za-z_]/.test(ch)) { let value = ''; while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) { value += input[i++]; column++; } tokens.push({ type: 'id', value, ...start }); continue; }
    if ('+-*/()'.includes(ch)) { tokens.push({ type: ch, value: ch, ...start }); i++; column++; continue; }
    throw Object.assign(new Error(`Unexpected character “${ch}”`), start);
  }
  tokens.push({ type: 'eof', value: '$', line, column }); return tokens;
}

export function parseExpression(input) {
  let tokens;
  try { tokens = tokenize(String(input ?? '')); }
  catch (error) { return { valid: false, ast: null, cst: null, steps: [{ action: `Reject: ${error.message}`, stack: '$', input: '' }], tokens: [], error: { message: error.message, line: error.line || 1, column: error.column || 1 } }; }
  let i = 0; const steps = [], stack = ['$'];
  const peek = () => tokens[i];
  const remaining = () => tokens.slice(i).map(token => token.type === 'eof' ? '$' : token.text || token.value).join(' ');
  const log = action => steps.push({ action, stack: [...stack].reverse().join(' '), input: remaining() });
  const terminal = token => ({ type: 'Terminal', value: token.text ?? token.value, children: [], line: token.line, column: token.column });
  const cnode = (type, children = []) => ({ type, children });
  function take(type) { const token = peek(); if (token.type !== type) throw Object.assign(new Error(`Expected ${type}, found ${token.value || 'end of input'}`), token); i++; log(`Match ${type}${token.value && token.type !== 'eof' ? ` “${token.value}”` : ''}`); return token; }
  function rule(name, body) { stack.push(name); try { return body(); } finally { stack.pop(); } }
  function factor() { return rule('F', () => {
    if (peek().type === 'number') { const token = take('number'); log('Reduce F → number'); return { ast: { type: 'Number', children: [], value: token.value }, cst: cnode('F', [terminal(token)]) }; }
    if (peek().type === 'id') { const token = take('id'); log('Reduce F → id'); return { ast: { type: 'Identifier', children: [], value: token.value }, cst: cnode('F', [terminal(token)]) }; }
    if (peek().type === '(') { const open = take('('), expression = expr(), close = take(')'); log('Reduce F → ( E )'); return { ast: { type: 'Group', children: [expression.ast] }, cst: cnode('F', [terminal(open), expression.cst, terminal(close)]) }; }
    take('id');
  }); }
  function termTail(leftAst) { return rule('T′', () => {
    if (peek().type === '*' || peek().type === '/') { const op = take(peek().type), right = factor(); log(`Reduce T′ → ${op.value} F T′`); const next = termTail({ type: 'BinaryExpression', children: [leftAst, right.ast], value: op.value }); return { ast: next.ast, cst: cnode('T′', [terminal(op), right.cst, next.cst]) }; }
    log('Reduce T′ → ε'); return { ast: leftAst, cst: cnode('T′', [cnode('ε')]) };
  }); }
  function term() { return rule('T', () => { const first = factor(), tail = termTail(first.ast); return { ast: tail.ast, cst: cnode('T', [first.cst, tail.cst]) }; }); }
  function exprTail(leftAst) { return rule('E′', () => {
    if (peek().type === '+' || peek().type === '-') { const op = take(peek().type), right = term(); log(`Reduce E′ → ${op.value} T E′`); const next = exprTail({ type: 'BinaryExpression', children: [leftAst, right.ast], value: op.value }); return { ast: next.ast, cst: cnode('E′', [terminal(op), right.cst, next.cst]) }; }
    log('Reduce E′ → ε'); return { ast: leftAst, cst: cnode('E′', [cnode('ε')]) };
  }); }
  function expr() { return rule('E', () => { const first = term(), tail = exprTail(first.ast); return { ast: tail.ast, cst: cnode('E', [first.cst, tail.cst]) }; }); }
  try {
    const parsed = expr();
    if (peek().type !== 'eof') throw Object.assign(new Error(`Unexpected token “${peek().value}”`), peek());
    log('Accept: input belongs to the grammar');
    return { valid: true, ast: parsed.ast, cst: parsed.cst, steps, tokens: tokens.filter(token => token.type !== 'eof') };
  } catch (error) {
    log(`Reject: ${error.message}`);
    return { valid: false, ast: null, cst: null, error: { message: error.message, line: error.line || 1, column: error.column || 1 }, steps, tokens: tokens.filter(token => token.type !== 'eof') };
  }
}

export const expressionGrammar = ['E → T E′', 'E′ → + T E′ | - T E′ | ε', 'T → F T′', 'T′ → * F T′ | / F T′ | ε', 'F → ( E ) | id | number'];

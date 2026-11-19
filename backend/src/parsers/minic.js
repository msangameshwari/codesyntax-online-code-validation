const keywords = new Set(['int', 'float', 'char', 'return', 'if', 'else', 'while', 'for', 'print', 'true', 'false']);

function lex(source) {
  const out = []; let i = 0, line = 1, column = 1;
  const emit = (type, value, l = line, c = column) => out.push({ type, value, line: l, column: c });
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { if (ch === '\n') { line++; column = 1; } else column++; i++; continue; }
    const l = line, c = column;
    if (/[A-Za-z_]/.test(ch)) { let value = ''; while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) { value += source[i++]; column++; } emit(keywords.has(value) ? 'keyword' : 'identifier', value, l, c); continue; }
    if (/[0-9]/.test(ch)) { let value = ''; while (i < source.length && /[0-9.]/.test(source[i])) { value += source[i++]; column++; } if (!/^(?:\d+\.?\d*|\.\d+)$/.test(value)) throw Object.assign(new Error('Malformed number'), { line: l, column: c }); emit('number', Number(value), l, c); continue; }
    const two = source.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) { emit('operator', two, l, c); i += 2; column += 2; continue; }
    if ('=+-*/%<>!;(),{}'.includes(ch)) { emit('symbol', ch, l, c); i++; column++; continue; }
    throw Object.assign(new Error(`Unknown character “${ch}”`), { line: l, column: c });
  }
  out.push({ type: 'eof', value: '$', line, column }); return out;
}

class Parser {
  constructor(source, profile) { this.tokens = lex(source); this.i = 0; this.trace = []; this.profile = profile; this.steps = 0; }
  peek() { return this.tokens[this.i]; }
  match(value) { if (this.peek().value === value) return this.tokens[this.i++]; return null; }
  need(value) { const t = this.match(value); if (!t) this.fail(`Expected “${value}”, found “${this.peek().value}”`); return t; }
  needType(type) { const t = this.peek(); if (t.type !== type) this.fail(`Expected ${type}, found “${t.value}”`, t); this.i++; return t; }
  fail(message, t = this.peek()) { throw Object.assign(new Error(message), { line: t.line, column: t.column }); }
  node(type, children = [], value) { return { type, ...(value !== undefined ? { value } : {}), children }; }
  production(name, children, ast) { const input = this.tokens.slice(this.i).map(t => String(t.value)).join(' '); this.trace.push({ action: `Reduce ${name}`, stack: input, input }); return { cst: this.node(name, children), ast }; }
  program() {
    const c = [], a = [];
    while (this.peek().type !== 'eof') { if (++this.steps > 10000) this.fail('Parser step limit exceeded'); const s = this.statement(); c.push(s.cst); a.push(s.ast); }
    this.trace.push({ action: a.length ? 'Accept PROGRAM' : 'Reduce PROGRAM → ε', stack: '$', input: '$' });
    return { cst: this.node('PROGRAM', c), ast: { type: 'Program', children: a } };
  }
  statement() {
    const p = this.profile;
    if (['int', 'float', 'char'].includes(this.peek().value)) return this.declaration();
    if (this.match('return')) { const k = this.tokens[this.i - 1]; const n = this.needType('number'); this.need(';'); return this.production('RETURN → return NUMBER ;', [this.node('return', [], 'return'), this.node('NUMBER', [], n.value), this.node(';', [], ';')], { type: 'Return', value: n.value, line: k.line, column: k.column }); }
    if (p !== 'core' && this.match('{')) { const children = [], body = []; while (this.peek().value !== '}' && this.peek().type !== 'eof') { const s = this.statement(); children.push(s.cst); body.push(s.ast); } this.need('}'); return this.production('BLOCK', children, { type: 'Block', children: body }); }
    if (p !== 'core' && this.match('if')) { this.need('('); const test = this.expression(); this.need(')'); const yes = this.statement(); let no = null; if (this.match('else')) no = this.statement(); return this.production('IF', [test.cst, yes.cst, ...(no ? [no.cst] : [])], { type: 'If', test: test.ast, yes: yes.ast, no: no?.ast }); }
    if (p !== 'core' && this.match('while')) { this.need('('); const test = this.expression(); this.need(')'); const body = this.statement(); return this.production('WHILE', [test.cst, body.cst], { type: 'While', test: test.ast, body: body.ast }); }
    if (p !== 'core' && this.match('for')) { this.need('('); const init = this.forPart(';'); this.need(';'); const test = this.expression(); this.need(';'); const step = this.forPart(')'); this.need(')'); const body = this.statement(); return this.production('FOR', [init.cst, test.cst, step.cst, body.cst], { type: 'For', init: init.ast, test: test.ast, step: step.ast, body: body.ast }); }
    if (p !== 'core' && this.match('print')) { this.need('('); const value = this.expression(); this.need(')'); this.need(';'); return this.production('PRINT', [value.cst], { type: 'Print', value: value.ast }); }
    const id = this.needIdentifier(); this.need('='); const value = p === 'core' ? this.coreExpression() : this.expression(); this.need(';'); return this.production('ASSIGNMENT → ID = EXPRESSION ;', [this.node('ID', [], id.value), this.node('=', [], '='), value.cst, this.node(';', [], ';')], { type: 'Assign', name: id.value, value: value.ast, line: id.line, column: id.column });
  }
  declaration() { const type = this.tokens[this.i++]; const id = this.needIdentifier(); this.need('='); const value = this.profile === 'core' ? this.needType('number') : this.expression().ast; this.need(';'); return this.production('DECLARATION → TYPE ID = NUMBER ;', [this.node('TYPE', [], type.value), this.node('ID', [], id.value), this.node('=', [], '='), this.node('NUMBER', [], this.profile === 'core' ? value.value : undefined), this.node(';', [], ';')], { type: 'Declare', name: id.value, dataType: type.value, value: this.profile === 'core' ? { type: 'Number', value: value.value } : value, line: id.line, column: id.column }); }
  needIdentifier() { const t = this.peek(); if (t.type !== 'identifier') this.fail(`Expected identifier, found “${t.value}”`); this.i++; return t; }
  coreExpression() { const first = this.peek(); if (first.type !== 'identifier' && first.type !== 'number') this.fail('MiniC Core expression must be ID or NUMBER, optionally followed by + NUMBER or - NUMBER', first); this.i++; const atom = first.type === 'identifier' ? { type: 'Identifier', name: first.value, line: first.line, column: first.column } : { type: 'Number', value: first.value }; let cst = this.node(first.type === 'identifier' ? 'ID' : 'NUMBER', [], first.value), ast = atom; if (['+', '-'].includes(this.peek().value)) { const op = this.tokens[this.i++], right = this.peek(); if (right.type !== 'number') this.fail('MiniC Core only permits NUMBER after + or -', right); this.i++; ast = { type: 'Binary', operator: op.value, left: ast, right: { type: 'Number', value: right.value }, line: op.line, column: op.column }; cst = this.node(`EXPRESSION ${op.value}`, [cst, this.node('NUMBER', [], right.value)]); } return { cst, ast }; }
  forPart(end) { if (this.peek().value === end) return { cst: this.node('EMPTY'), ast: { type: 'Empty' } }; const id = this.needIdentifier(); this.need('='); const val = this.expression(); return { cst: this.node('Assignment', [val.cst], id.value), ast: { type: 'Assign', name: id.value, value: val.ast, line: id.line, column: id.column } }; }
  expression(min = 0) { const t = this.peek(); let left;
    if (this.match('(')) { left = this.expression(); this.need(')'); }
    else if (t.type === 'number') { this.i++; left = { cst: this.node('NUMBER', [], t.value), ast: { type: 'Number', value: t.value } }; }
    else if (t.type === 'identifier' || t.value === 'true' || t.value === 'false') { this.i++; left = { cst: this.node(t.type === 'identifier' ? 'ID' : 'BOOLEAN', [], t.value), ast: t.type === 'identifier' ? { type: 'Identifier', name: t.value, line: t.line, column: t.column } : { type: 'Boolean', value: t.value === 'true' } }; }
    else this.fail(`Expected expression, found “${t.value}”`, t);
    const precedence = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
    while ((precedence[this.peek().value] || 0) > min) { const op = this.tokens[this.i++], right = this.expression(precedence[op.value]); left = { cst: this.node(`EXPRESSION ${op.value}`, [left.cst, right.cst]), ast: { type: 'Binary', operator: op.value, left: left.ast, right: right.ast, line: op.line, column: op.column } }; }
    return left;
  }
}

export function parseMiniC(source, profile = 'extended') {
  try {
    const parser = new Parser(source, profile === 'core' ? 'core' : 'extended');
    const parsed = parser.program();
    return { valid: true, ...parsed, tokens: parser.tokens.filter(t => t.type !== 'eof'), trace: parser.trace, errors: [], engine: `MiniC ${profile === 'core' ? 'Core (Assessment)' : 'Extended'} recursive descent parser` };
  } catch (error) {
    return { valid: false, cst: null, ast: null, tokens: [], trace: [{ action: `Reject: ${error.message}`, stack: 'error', input: error.message }], errors: [{ message: error.message, line: error.line || 1, column: error.column || 1 }], engine: `MiniC ${profile} recursive descent parser` };
  }
}

export function runMiniC(ast, { maxSteps = 20000, maxMs = 100, maxOutput = 16000 } = {}) {
  const vars = new Map(), output = []; const started = Date.now(); let steps = 0, returnValue = null;
  const tick = node => { if (++steps > maxSteps || Date.now() - started > maxMs) throw Object.assign(new Error('Execution step/time limit exceeded'), { line: node?.line || 1, column: node?.column || 1 }); };
  const expr = n => { tick(n); switch (n.type) { case 'Number': case 'Boolean': return n.value; case 'Identifier': if (!vars.has(n.name)) throw Object.assign(new Error(`Undefined variable “${n.name}”`), n); return vars.get(n.name); case 'Binary': { const a = expr(n.left), b = expr(n.right); switch (n.operator) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': if (b === 0) throw Object.assign(new Error('Division by zero'), n); return a / b; case '%': if (b === 0) throw Object.assign(new Error('Division by zero'), n); return a % b; case '==': return a === b; case '!=': return a !== b; case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b; case '&&': return Boolean(a && b); case '||': return Boolean(a || b); } } default: throw new Error('Unsupported expression'); } };
  const exec = n => { tick(n); switch (n.type) { case 'Program': case 'Block': for (const x of n.children) exec(x); break; case 'Declare': if (vars.has(n.name)) throw Object.assign(new Error(`Variable “${n.name}” is already declared`), n); vars.set(n.name, expr(n.value)); break; case 'Assign': if (!vars.has(n.name)) throw Object.assign(new Error(`Undefined variable “${n.name}”`), n); vars.set(n.name, expr(n.value)); break; case 'Print': output.push(String(expr(n.value))); if (output.join('\n').length > maxOutput) throw Object.assign(new Error('Output limit exceeded'), n); break; case 'If': exec(expr(n.test) ? n.yes : (n.no || { type: 'Block', children: [] })); break; case 'While': while (expr(n.test)) { tick(n); exec(n.body); } break; case 'For': if (n.init.type !== 'Empty') exec(n.init); while (expr(n.test)) { tick(n); exec(n.body); if (n.step.type !== 'Empty') exec(n.step); } break; case 'Return': returnValue = n.value; break; case 'Empty': break; default: throw new Error(`Unsupported statement ${n.type}`); } };
  try { exec(ast); return { ok: true, output: output.join('\n'), returnValue, exitCode: 0, runtimeMs: Date.now() - started, timedOut: false }; }
  catch (error) { return { ok: false, output: output.join('\n'), error: { message: error.message, line: error.line || 1, column: error.column || 1 }, exitCode: 1, runtimeMs: Date.now() - started, timedOut: /limit/.test(error.message) }; }
}

export const coreGrammar = ['PROGRAM → STATEMENT PROGRAM | ε', 'STATEMENT → DECLARATION | ASSIGNMENT | RETURN', 'DECLARATION → TYPE ID = NUMBER ;', 'ASSIGNMENT → ID = EXPRESSION ;', 'RETURN → return NUMBER ;', 'TYPE → int | float | char', 'EXPRESSION → ID | NUMBER | ID + NUMBER | ID - NUMBER'];

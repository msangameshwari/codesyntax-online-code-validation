const operatorChars = '+-*/%=<>!&|^~?:';
const delimiters = '(){}[];,.';
const operatorLexemes = ['===', '!==', '=>', '==', '!=', '<=', '>=', '++', '--', '&&', '||', '+=', '-=', '*=', '/=', '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?', ':'];
const operatorPrefixes = [...new Set(operatorLexemes.flatMap(op => Array.from({ length: op.length }, (_, i) => op.slice(0, i + 1))))].filter(prefix => prefix !== '/').sort((a, b) => a.length - b.length || a.localeCompare(b));
const operatorStateByPrefix = new Map(operatorPrefixes.map((prefix, i) => [prefix, `qOp${i}`]));
const operatorPrefixByState = new Map([...operatorStateByPrefix].map(([prefix, state]) => [state, prefix]));
const operatorStates = operatorPrefixes.map(prefix => ({ id: operatorStateByPrefix.get(prefix), label: `Operator prefix ${prefix}`, kind: operatorLexemes.includes(prefix) ? 'accept' : 'normal', ...(operatorLexemes.includes(prefix) ? { token: 'Operator' } : {}) }));
const operatorTransitions = operatorPrefixes.map(prefix => {
  const parent = prefix.slice(0, -1);
  const from = parent === '' ? 'q0' : parent === '/' ? 'q11' : operatorStateByPrefix.get(parent);
  return [from, `character ${prefix.at(-1)} (${prefix})`, operatorStateByPrefix.get(prefix)];
});

export const dfaDefinition = {
  start: 'q0',
  operatorLexemes,
  keywords: 'const let var function return if else while for class new true false null undefined import from export async await'.split(' '),
  states: [
    { id: 'q0', label: 'Start', kind: 'start' }, { id: 'q1', label: 'Identifier', kind: 'accept', token: 'Identifier / keyword' },
    { id: 'q2', label: 'Integer', kind: 'accept', token: 'Numeric literal' }, { id: 'q3', label: 'Whitespace', kind: 'accept', token: 'Ignored whitespace' },
    { id: 'q5', label: 'Delimiter', kind: 'accept', token: 'Separator' },
    { id: 'q6', label: 'Double string body', kind: 'normal' }, { id: 'q7', label: 'Decimal point', kind: 'normal' },
    { id: 'q8', label: 'Float', kind: 'accept', token: 'Numeric literal' }, { id: 'q9', label: 'Single string body', kind: 'normal' },
    { id: 'q10', label: 'Double-string escape', kind: 'normal' }, { id: 'q11', label: 'Slash / operator prefix', kind: 'accept', token: 'Operator' },
    { id: 'q12', label: 'Line comment', kind: 'accept', token: 'Ignored comment' }, { id: 'q13', label: 'Single-string escape', kind: 'normal' }, { id: 'q14', label: 'Double string FINAL', kind: 'accept', token: 'String literal' }, { id: 'q15', label: 'Single string FINAL', kind: 'accept', token: 'String literal' }, { id: 'qDead', label: 'Error', kind: 'dead' }, ...operatorStates,
  ],
  transitions: [
    ['q0', 'letter / _ / $', 'q1'], ['q0', 'digit', 'q2'], ['q0', 'whitespace', 'q3'], ['q0', 'slash', 'q11'], ['q0', 'delimiter', 'q5'], ['q0', 'double quote', 'q6'], ['q0', 'single quote', 'q9'], ['q0', 'dot', 'q7'], ['q0', 'other', 'qDead'],
    ['q1', 'letter / digit / _ / $', 'q1'], ['q2', 'digit', 'q2'], ['q2', 'dot', 'q7'], ['q7', 'digit', 'q8'], ['q8', 'digit', 'q8'], ['q3', 'whitespace', 'q3'],
    ['q6', 'escaped character', 'q10'], ['q6', 'closing double quote', 'q14'], ['q6', 'other character', 'q6'], ['q9', 'escaped character', 'q13'], ['q9', 'closing single quote', 'q15'], ['q9', 'other character', 'q9'], ['q10', 'any', 'q6'], ['q13', 'any', 'q9'],
    ['q11', '// comment opener', 'q12'], ['q12', 'not newline', 'q12'], ...operatorTransitions,
  ],
  accepting: ['q1', 'q2', 'q3', 'q5', 'q8', 'q11', 'q12', 'q14', 'q15', ...operatorStates.filter(state => state.kind === 'accept').map(state => state.id)],
};

function charClass(ch) {
  if (/[A-Za-z_$]/.test(ch)) return 'letter';
  if (/[0-9]/.test(ch)) return 'digit';
  if (/\s/.test(ch)) return 'whitespace';
  if (ch === '.') return 'dot';
  if (ch === '/') return 'slash';
  if (ch === '"') return 'doubleQuote';
  if (ch === "'") return 'singleQuote';
  if (ch === '\\') return 'backslash';
  if (operatorChars.includes(ch)) return 'operator';
  if (delimiters.includes(ch)) return 'delimiter';
  return 'other';
}

function transition(state, cls, quote, ch) {
  const commonId = ['letter', 'digit', 'underscore', 'dollar'];
  if (state === 'q0') return cls === 'operator' ? operatorStateByPrefix.get(ch) : ({ letter: 'q1', digit: 'q2', whitespace: 'q3', slash: 'q11', delimiter: 'q5', doubleQuote: 'q6', singleQuote: 'q9', dot: 'q7', other: 'qDead' })[cls];
  if (state === 'q1' && commonId.includes(cls)) return 'q1';
  if (state === 'q2' && cls === 'digit') return 'q2';
  if ((state === 'q2' || state === 'q0') && cls === 'dot') return 'q7';
  if (state === 'q7' && cls === 'digit') return 'q8';
  if (state === 'q8' && cls === 'digit') return 'q8';
  if (state === 'q3' && cls === 'whitespace') return 'q3';
  if (state === 'q11') return ch === '/' ? 'q12' : ch === '=' ? operatorStateByPrefix.get('/=') : undefined;
  if (operatorPrefixByState.has(state) && cls === 'operator') return operatorStateByPrefix.get(operatorPrefixByState.get(state) + ch);
  if (state === 'q12' && cls !== 'newline') return 'q12';
  if ((state === 'q6' || state === 'q9') && cls === 'backslash') return 'q10';
  if (state === 'q10') return 'q6';
  if (state === 'q13') return 'q9';
  if (state === 'q6' && cls === 'doubleQuote') return 'q14';
  if (state === 'q9' && cls === 'singleQuote') return 'q15';
  if ((state === 'q6' || state === 'q9') && cls !== 'newline') return state;
  return undefined;
}

export function scanWithDfa(source) {
  const tokens = [], trace = [], errors = [];
  let i = 0, line = 1, column = 1;
  const advance = ch => { i++; if (ch === '\n') { line++; column = 1; } else column++; };
  while (i < source.length) {
    const start = { line, column }, begin = i;
    let state = 'q0', quote = '', closed = false, consumed = false;
    while (i < source.length) {
      const ch = source[i], cls = ch === '\n' ? 'newline' : charClass(ch);
      let next = transition(state, cls, quote, ch);
      if (state === 'q0' && cls === 'doubleQuote') quote = '"';
      if (state === 'q0' && cls === 'singleQuote') quote = "'";
      if (next === undefined) break;
      if (next === 'q14' || next === 'q15') { trace.push({ step: trace.length + 1, character: ch, line, column, state, inputClass: cls, nextState: next, accepting: true }); advance(ch); state = next; closed = true; break; }
      trace.push({ step: trace.length + 1, character: ch, line, column, state, inputClass: cls, nextState: next, accepting: dfaDefinition.accepting.includes(next) });
      advance(ch); consumed = true; state = next;
      if (state === 'q12' && ch === '\n') { state = 'q0'; break; }
      if (state === 'q5') break;
      if (state === 'qDead') break;
    }
    if (closed) { const value = source.slice(begin, i); tokens.push({ token: value, type: 'String literal', value, line: start.line, column: start.column }); continue; }
    if (state === 'q0' && !consumed) {
      if (closed) { const value = source.slice(begin, i); tokens.push({ token: value, type: 'String literal', value, line: start.line, column: start.column }); }
      else { const ch = source[i]; if (ch === '/' && source[i + 1] === '/') { // q11 transitions to q12 on the next loop iteration
          continue;
        }
        if (/\s/.test(ch)) { advance(ch); continue; }
        trace.push({ step: trace.length + 1, character: ch, line, column, state: 'q0', inputClass: charClass(ch), nextState: 'qDead', accepting: false });
        errors.push({ message: `Unknown character “${ch}”`, line, column }); tokens.push({ token: ch, type: 'Unknown token', value: ch, line, column }); advance(ch);
      }
      continue;
    }
    const value = source.slice(begin, i);
    if (state === 'q1') { const type = dfaDefinition.keywords.includes(value) ? 'Keyword' : 'Identifier'; tokens.push({ token: value, type, value, line: start.line, column: start.column }); }
    else if (state === 'q2' || state === 'q8') tokens.push({ token: value, type: 'Numeric literal', value, line: start.line, column: start.column });
    else if (state === 'q11' || operatorPrefixByState.has(state)) { if (dfaDefinition.operatorLexemes.includes(value)) tokens.push({ token: value, type: 'Operator', value, line: start.line, column: start.column }); else { errors.push({ message: `Invalid operator “${value}”`, line: start.line, column: start.column }); tokens.push({ token: value, type: 'Unknown token', value, line: start.line, column: start.column }); } }
    else if (state === 'q5') tokens.push({ token: value, type: 'Separator', value, line: start.line, column: start.column });
    else if (state === 'q3' || state === 'q12') { /* whitespace and comments are ignored */ }
    else if (state === 'q6' || state === 'q9' || state === 'q10' || state === 'q13') { errors.push({ message: 'Unterminated string literal', line: start.line, column: start.column }); tokens.push({ token: value, type: 'Invalid / unterminated string', value, line: start.line, column: start.column }); }
    else if (state === 'q7') { errors.push({ message: 'Malformed numeric literal', line: start.line, column: start.column }); tokens.push({ token: value, type: 'Invalid numeric literal', value, line: start.line, column: start.column }); }
    else if (state === 'qDead') { const ch = source[begin]; errors.push({ message: `Unknown character “${ch}”`, line: start.line, column: start.column }); tokens.push({ token: ch, type: 'Unknown token', value: ch, line: start.line, column: start.column }); }
    if (i === begin) advance(source[i]);
  }
  return { tokens, trace, errors, states: dfaDefinition.states, transitions: dfaDefinition.transitions, accepting: dfaDefinition.accepting, start: dfaDefinition.start };
}

export const keywords = new Set(dfaDefinition.keywords);

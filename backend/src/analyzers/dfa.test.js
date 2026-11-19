import test from 'node:test';
import assert from 'node:assert/strict';
import { dfaDefinition } from './dfa.js';
import { lex, scanWithDfa } from './lexer.js';

test('DFA definition has q0, accepting states, and actual transitions for lexical classes', () => {
  assert.equal(dfaDefinition.start, 'q0');
  assert.ok(dfaDefinition.accepting.includes('q1'));
  for (const state of dfaDefinition.accepting) assert.ok(dfaDefinition.states.some(item => item.id === state));
  for (const cls of ['letter / _ / $', 'digit', 'whitespace', 'slash', 'delimiter', 'dot', 'other']) assert.ok(dfaDefinition.transitions.some(row => row[0] === 'q0' && row[1] === cls));
  assert.ok(dfaDefinition.transitions.some(row => row[0] === 'q0' && row[1].startsWith('character +')));
});

test('DFA simulator and lexer return the same identifier, keyword, number, operator, delimiter and whitespace tokens', () => {
  const source = 'const item_1 = 12.5 + 3;';
  const simulated = scanWithDfa(source);
  assert.deepEqual(lex(source), simulated.tokens);
  assert.deepEqual(simulated.tokens.map(t => t.type), ['Keyword', 'Identifier', 'Operator', 'Numeric literal', 'Operator', 'Numeric literal', 'Separator']);
  assert.ok(simulated.trace.every((step, index) => step.step === index + 1));
  assert.ok(simulated.trace.some(step => step.state === 'q0' && step.nextState === 'q1'));
});

test('DFA recognizes comments and strings, and reports the exact invalid-character position', () => {
  const result = scanWithDfa('let s = "ok"; // comment\n@');
  assert.ok(result.tokens.some(t => t.type === 'String literal'));
  assert.equal(result.errors[0].line, 2);
  assert.equal(result.errors[0].column, 1);
  for (const step of result.trace) assert.ok(dfaDefinition.transitions.some(([from, _label, to]) => from === step.state && (to === step.nextState || to.split(' / ').includes(step.nextState))), `${step.state} → ${step.nextState} appears in the authoritative transition table`);
});

test('slash division, slash assignment, and decimal errors are recognized by the DFA', () => {
  const operators = scanWithDfa('let half = 10 / 2; value /= 2;');
  assert.ok(operators.tokens.some(token => token.token === '/' && token.type === 'Operator'));
  assert.ok(operators.tokens.some(token => token.token === '/=' && token.type === 'Operator'));
  const malformed = scanWithDfa('let rate = 12.;');
  assert.equal(malformed.errors[0].message, 'Malformed numeric literal');
  assert.equal(malformed.errors[0].line, 1);
});

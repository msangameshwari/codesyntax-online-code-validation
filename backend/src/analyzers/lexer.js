import { scanWithDfa } from './dfa.js';

// The teaching lexer and DFA simulator deliberately share this one scanner.
export function lex(source) {
  return scanWithDfa(String(source ?? '')).tokens;
}

export { scanWithDfa };

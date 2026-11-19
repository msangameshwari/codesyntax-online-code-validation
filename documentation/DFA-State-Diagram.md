# DFA Lexical Recognizer

The UI loads states and transition rows from `backend/src/analyzers/dfa.js`. That definition is the source for the diagram, the `/api/lexer/dfa` table, the simulator, and the lexer. The recognizer tokenizes a documented JavaScript-like teaching subset; the parser remains responsible for grammar.

```mermaid
stateDiagram-v2
  [*] --> q0
  q0 --> q1: letter / _ / $
  q1 --> q1: letter / digit / _ / $
  q0 --> q2: digit
  q2 --> q2: digit
  q2 --> q7: dot
  q0 --> q7: dot
  q7 --> q8: digit
  q8 --> q8: digit
  q0 --> q3: whitespace
  q3 --> q3: whitespace
  q0 --> qOpN: operator character / exact first-character edge
  qOpN --> qOpM: exact next character for an operator prefix
  q0 --> q5: delimiter
  q0 --> q6: double quote
  q6 --> q6: ordinary string character
  q6 --> q10: escape
  q10 --> q6: escaped character
  q6 --> q14: closing double quote
  q0 --> q9: single quote
  q9 --> q9: ordinary string character
  q9 --> q13: escape
  q13 --> q9: escaped character
  q9 --> q15: closing single quote
  q0 --> q11: slash
  q11 --> q12: second slash / line comment
  q11 --> qOpN: equals / slash assignment
  q12 --> q12: comment character
  q0 --> qDead: invalid character
```

`q1`, `q2`, `q3`, `q5`, `q8`, `q11`, `q12`, `q14`, `q15`, and any `qOpN` whose prefix is a complete operator are accepting states (keywords are classified after identifier recognition). Each generated `qOpN` encodes one exact operator prefix, so no hidden input buffer is needed to determine transitions. `q0` is the start state. `qDead` marks a rejected character; the lexer reports its 1-based position and restarts at `q0` to continue collecting diagnostics. Accepting token boundaries return control to the scanner at `q0`; that reset is scanner control, not a consumed character transition. The simulator caps returned trace output at 2,000 transitions.

The browser highlights current/traversed transitions for the submitted simulation. The diagram is a visual state view; the scanner API is the executable source of truth.

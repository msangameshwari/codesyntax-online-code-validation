# DFA Transition Summary

The complete runtime rows are returned by authenticated `GET /api/lexer/dfa`; the simulator uses the same `dfaDefinition` object. Class labels describe actual scanner transitions. Operator-state transitions occur only when the candidate remains a prefix of a configured operator; the scanner emits the longest recognized operator and reprocesses the next character.

| State | Input class | Next state | Meaning |
|---|---|---|---|
| q0 | letter / `_` / `$` | q1 | Begin identifier; classify as keyword after scanning. |
| q1 | letter / digit / `_` / `$` | q1 | Continue identifier. |
| q0 | digit | q2 | Begin integer. |
| q2 | digit | q2 | Continue integer. |
| q0 or q2 | dot | q7 | Decimal point; requires a following digit. |
| q7 | digit | q8 | Begin fraction. |
| q8 | digit | q8 | Continue float. |
| q0 / q3 | whitespace | q3 | Ignore whitespace; q3 loops over whitespace. |
| q0 | exact operator character | qOpN | Enter the trie node for that exact operator prefix. |
| qOpN | exact next character in an operator | qOpM | Advance to the next prefix node; the current node accepts only if its prefix is a complete operator. |
| q0 | delimiter | q5 | Accept separator/punctuation. |
| q0 | quote | q6 or q9 | Enter string body; escapes use q10/q13. |
| q6/q9 | matching closing quote | q14/q15 | Accept complete string. |
| q0 | slash | q11 | Check for comment or slash operator. |
| q11 | second slash | q12 | Ignore line comment through line end. |
| q11 | equals | qOpM | Follow the generated `/=` trie edge. |
| q0 | unsupported character | qDead | Emit a located lexical diagnostic. |

Whitespace/comments are skipped. The scanner reports malformed numeric forms and unterminated strings. This lexical DFA recognizes tokens; it is not a parser for nested source grammar.

# Core LL(1) Transition Table

`—` means error. `NUMBER` and `ID` are token types.

| Nonterminal | int | float | char | ID | return | NUMBER | `$` |
|---|---|---|---|---|---|---|---|
| PROGRAM | STATEMENT PROGRAM | STATEMENT PROGRAM | STATEMENT PROGRAM | STATEMENT PROGRAM | STATEMENT PROGRAM | — | ε |
| STATEMENT | DECLARATION | DECLARATION | DECLARATION | ASSIGNMENT | RETURN | — | — |
| DECLARATION | TYPE ID = NUMBER ; | TYPE ID = NUMBER ; | TYPE ID = NUMBER ; | — | — | — | — |
| ASSIGNMENT | — | — | — | ID = EXPRESSION ; | — | — | — |
| RETURN | — | — | — | — | return NUMBER ; | — | — |
| TYPE | int | float | char | — | — | — | — |
| EXPRESSION | — | — | — | ID | — | NUMBER | — |

After `EXPRESSION` consumes an `ID` or `NUMBER`, it may optionally consume `+ NUMBER` or `- NUMBER`; then its caller expects `;`. The handwritten parser directly checks this restricted form. Core contains no `else`, so the dangling-else ambiguity does not apply. Extended binds `else` to the nearest unmatched `if` through recursive descent.

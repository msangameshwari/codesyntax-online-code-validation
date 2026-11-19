# Grammars

## Arithmetic expression lab

```text
E  → T E′
E′ → + T E′ | - T E′ | ε
T  → F T′
T′ → * F T′ | / F T′ | ε
F  → ( E ) | id | number
```

`*` and `/` bind more tightly than `+` and `-`; operators at the same level associate left to right. `id` and `number` are lexical tokens.

## MiniC Core (Assessment)

```text
PROGRAM       → STATEMENT PROGRAM | ε
STATEMENT     → DECLARATION | ASSIGNMENT | RETURN
DECLARATION   → TYPE ID = NUMBER ;
ASSIGNMENT    → ID = EXPRESSION ;
RETURN        → return NUMBER ;
TYPE          → int | float | char
EXPRESSION    → ID | NUMBER | ID + NUMBER | ID - NUMBER
```

This grammar deliberately excludes print, multiplication, division, control flow, functions, and parenthesized expressions. Numeric literals are lexed as one NUMBER token, including decimals. `char` declarations in this subset carry a numeric literal because the assessment production specifies NUMBER.

FIRST/FOLLOW for Core (with `$` as end marker):

| Nonterminal | FIRST | FOLLOW |
|---|---|---|
| PROGRAM | `int`, `float`, `char`, `ID`, `return`, `ε` | `$` |
| STATEMENT | `int`, `float`, `char`, `ID`, `return` | `int`, `float`, `char`, `ID`, `return`, `$` |
| DECLARATION | `int`, `float`, `char` | `int`, `float`, `char`, `ID`, `return`, `$` |
| ASSIGNMENT | `ID` | `int`, `float`, `char`, `ID`, `return`, `$` |
| RETURN | `return` | `int`, `float`, `char`, `ID`, `return`, `$` |
| TYPE | `int`, `float`, `char` | `ID` |
| EXPRESSION | `ID`, `NUMBER` | `;` |

The SELECT sets for the three `STATEMENT` alternatives are disjoint. `PROGRAM → ε` is selected on `$`, which is not in FIRST(STATEMENT), so the Core productions are LL(1).

## MiniC Extended

Extended is a separate teaching profile. The implemented parser accepts declarations and assignments, blocks, `if`/`else`, `while`, `for`, `print(expression)`, numeric/boolean expressions, comparisons and boolean operators. It uses precedence climbing for expressions. Its grammar and syntax support are intentionally smaller than full C; do not label it as a C compiler.

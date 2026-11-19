# Language and Parser Support

| Editor language | Validation engine | Syntax validation | Lexical tokens | CST | AST | Run | Preview |
|---|---|---:|---:|---:|---:|---:|---:|
| JavaScript | Babel parser | Yes | DFA subset only | No | Yes | Disabled | No |
| TypeScript | Babel TypeScript parser | Yes | No | No | Yes | Disabled | No |
| HTML | parse5 | Yes (HTML recovery rules) | No | No | Parse tree | Disabled | No |
| CSS | PostCSS | Yes | No | No | Yes | Disabled | No |
| Python | Tree-sitter Python WASM | Yes | Yes | Yes | No separate AST | Disabled | No |
| C | Tree-sitter C WASM | Yes | Yes | Yes | No separate AST | Disabled | No |
| C++ | Tree-sitter C++ WASM | Yes | Yes | Yes | No separate AST | Disabled | No |
| Java | Tree-sitter Java WASM | Yes | Yes | Yes | No separate AST | Disabled | No |
| PHP | PHP-Parser | Yes | No | No | Yes | Disabled | No |
| C# | Tree-sitter C# WASM | Yes | Yes | Yes | No separate AST | Disabled | No |
| Go | Tree-sitter Go WASM | Yes | Yes | Yes | No separate AST | Disabled | No |
| SQL (PostgreSQL) | pgsql-ast-parser | Yes | No | No | Yes | Disabled | No |
| MiniC Core (Assessment) | CodeSyntax recursive-descent grammar | Yes | Parser tokens | Yes | Yes | Bounded interpreter; return value only | No |
| MiniC Extended | CodeSyntax recursive-descent grammar | Yes | Parser tokens | Yes | Yes | Bounded AST interpreter | No |

“Yes” means parser dependency loads and API valid/invalid cases pass in the backend suite. CST and AST are distinguished; adapters do not manufacture a second representation. SQL support is PostgreSQL dialect only. MiniC is an educational subset, not a claim of C language support.

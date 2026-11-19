# Assessment Checklist

| Subject / feature | Status | Evidence / limit |
|---|---|---|
| FSWD React, Router, Express REST, MongoDB, JWT, bcrypt, CRUD | Implemented in existing app | Existing pages, APIs, and models retained. |
| 12 requested syntax parsers | Configured and tested | Valid and invalid API cases for JS, TS, HTML, CSS, Python, C, C++, Java, PHP, C#, Go, and PostgreSQL SQL. |
| Lexical analysis | Partial | Dedicated JavaScript subset lexer; Tree-sitter token leaves for its six grammars. Other adapters do not promise token tables. |
| Arithmetic CFG / recursive descent / LL(1) | Implemented | Existing parser lab, grammar, reductions and AST. |
| MiniC Core exact assessment profile | Implemented | Separate parser, restricted productions, empty input, trace, CST, AST. |
| MiniC Extended parser/interpreter | Implemented, subset only | Output derived from input; bounds and tests. Not full C. |
| DFA lexical recognition and simulator | Implemented for the documented JavaScript-subset token classes | Shared definition powers lexer/API/diagram/table; test coverage verifies identical tokens and transition edges. |
| Network Monitor charts/topology | Implemented from actual API configuration and MongoDB request logs | IP paths, proxy topology, packet capture, and persistent alert acknowledgement are unavailable. |
| CST and AST for every language | Partial | Tree-sitter grammars return CST; AST adapters return AST. No fabricated alternate tree. |
| Full-source arithmetic-expression extraction/tree | Unavailable | Editor parser adapters do not expose a common expression visitor; expression lab displays its own input's AST and grammar CST. |
| External language execution | Unavailable | Disabled; no secure isolated runtime configured. |
| API health and network telemetry | Implemented | Real logs and database health; no credentials logged. |
| UI end-to-end smoke tests | Not added | Backend test suite and production build are run; no browser automation suite configured. |
| MongoDB connected CRUD integration test | Not run | Requires a configured MongoDB URI/database. |

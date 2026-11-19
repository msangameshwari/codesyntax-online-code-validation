# Architecture

The checked-in project is React + Vite + Monaco in `frontend/`, with an Express 5 REST API, Mongoose models, and MongoDB in `backend/`. Browser requests use Axios, JWT bearer authentication, JSON payloads, and request timing events. Express request logs store method/path/status/duration, without request bodies or credentials.

Validation resolves a server-side language catalog and calls separate parser adapters. Babel handles JavaScript/TypeScript, parse5 HTML, PostCSS CSS, Tree-sitter WASM Python/C/C++/Java/C#/Go, PHP-Parser PHP, and pgsql-ast-parser PostgreSQL SQL. User code is parsed but never compiled or executed.

Submission POST revalidates input and persists parser-derived status, diagnostics, tokens and available trees. History is scoped to the authenticated student except for admins. Mongo health is exposed at `/health` and `/api/network/status`.

The FLAT lab has an arithmetic parser and two independent MiniC profiles. The MiniC interpreter evaluates only AST node types produced by that parser, with execution bounds. It does not pass source text to JavaScript evaluation or system processes.

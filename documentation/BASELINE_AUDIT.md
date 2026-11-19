# CodeSyntax Baseline Audit

## Repository and actual stack

This checkout is the React/Vite + Express/Mongoose project. The older pasted-project description of Flask/SQLite does not match this repository and was treated only as a clue to verify.

```text
.
├── backend/
│   ├── src/analyzers/       lexer and analyzer tests
│   ├── src/middleware/      JWT authentication and roles
│   ├── src/models/          Mongoose user, submission, log, project models
│   ├── src/parsers/         Tree-sitter, adapters, expression and MiniC parsers
│   ├── src/routes/          Express REST API and route tests
│   ├── src/services/        language validation and registration validation
│   ├── package.json
│   └── .env.example         key names/placeholders; do not commit credentials
├── frontend/
│   ├── src/App.jsx          React Router pages and app shell
│   ├── src/context/         auth state
│   ├── src/services/        Axios client and request timing events
│   ├── src/pages/           dedicated DFA and Network Monitor pages (added in this task)
│   ├── src/style.css
│   ├── package.json
│   └── .env.example
├── documentation/
├── sample-inputs/
└── sample-outputs/
```

There is no separate database folder or migration framework. MongoDB Atlas/local MongoDB is connected through Mongoose. The Express entry point is `backend/src/server.js`; the Vite/React entry point is `frontend/src/main.jsx` and routes are in `frontend/src/App.jsx`.

## Existing functionality at task start

- Student registration/login, JWT and bcrypt; admin guard and owner-scoped submission queries.
- Monaco editor with 12 syntax parser adapters and a language catalog.
- JavaScript-subset lexer, arithmetic recursive-descent parser, history, admin dashboard, project ZIP inspection, and API request logging.
- Existing Network Monitor showed browser Axios timings and persisted server logs, with a basic flow diagram.
- A separate DFA page/simulator, DFA transition model, timing charts, and a network topology backed by runtime health data were absent; these are the focus of the current changes.
- Parser and history functionality were present, though full-program CST/AST capabilities differed by parser. Expression lab showed AST/reduction information but not a distinct concrete grammar tree.
- The backend environment template contained values where placeholders were expected; the template has been replaced with placeholders. The actual `backend/.env` and production settings were not changed.

## Baseline test results before this audit's changes

Command: `npm test` from `backend` — **39 passed, 0 failed**. This count includes the preceding parser/registration/submission changes already present in the workspace at the start of this prompt. API tests start local HTTP servers, so the command may require localhost socket permission in a restricted environment.

Command: `npm run build` from `frontend` — passed with Vite before DFA/network page work.

Browser automation was not configured, so no browser-console or end-to-end smoke-test result is claimed.

## Issues and regression plan

| Issue | File / reproduction | Root cause | Fix / regression test |
|---|---|---|---|
| No inspectable DFA | `frontend/src/App.jsx`: no `/dfa` route; `backend/src/analyzers/lexer.js` used independent regex rules. | No common automaton definition for token recognition and visualization. | Shared `dfaDefinition` + `scanWithDfa`, lexer delegation, API endpoints, UI diagram/table/trace; tests compare lexer tokens and DFA tokens. |
| Network topology was partly static | Network page lacked configured origin/listener data and charts. | No status metadata or visualization derived from server logs. | Health metadata and view derived from actual logs, API URL, browser URL and configured port; no IP guesses. |
| Request logs lacked correlation ID | `server.js` did not persist the response request ID. | NetworkLog schema omitted the ID. | Added request ID to records and schema; browser event displays response header ID when present. |
| Deployment template had credentials | `backend/.env.example` showed actual-looking Mongo/JWT values. | Example was not placeholder-only. | Replaced those lines with setup placeholders; left `.env` and deployed credentials untouched. |
| Full parser trees vary | Some adapters return ASTs, some Tree-sitter CSTs. | Parser libraries expose different structures. | Matrix labels actual output separately; unsupported representations remain unavailable. |

See the current [Language Support Matrix](Language-Support-Matrix.md) and [Assessment Checklist](Assessment-Checklist.md) for implemented, partial, and unavailable areas.

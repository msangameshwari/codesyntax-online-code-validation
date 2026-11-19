# CodeSyntax — Online Code Analysis and Validation

Academic MERN project demonstrating full stack development, computer networks, and formal language parsing.

## Requirements

- Node.js 22.19+
- MongoDB Atlas URI or local MongoDB

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`, a long random `JWT_SECRET`, and `CLIENT_ORIGIN=http://localhost:5173`.
2. Copy `frontend/.env.example` to `frontend/.env` if the API is not at `http://localhost:5000/api`.
3. In two terminals run:

```sh
cd backend
npm install
npm run dev
```

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Registration creates student accounts. To grant an admin role, update that user's `role` to `admin` directly in MongoDB; public registration cannot create admins.

## Implemented modules

- React Router application, responsive dark workspace, Monaco editor, account pages, and authenticated dashboard.
- JWT sessions, bcrypt password hashing, role checks, owner-scoped submission history, MongoDB stats, and account controls.
- Non-executing parser adapters for all 12 editor languages: Babel JavaScript/TypeScript, parse5 HTML, PostCSS CSS, Tree-sitter WASM Python/C/C++/Java/C#/Go, PHP-Parser PHP, and pgsql-ast-parser for PostgreSQL SQL. The SQL dialect is stated in the language picker.
- JavaScript-subset DFA lexical analyzer and simulator backed by one shared definition, with a transition table, character trace and located lexical errors.
- Arithmetic expression recursive-descent parser with grammar, located errors, reduction trace, and AST; separate MiniC Core/Extended FLAT profiles.
- Client request telemetry, request-ID-correlated MongoDB API logs, measured response bars/status counts, health reporting, and a topology labeled from the actual configured origins. IPs, proxy details, and packet capture are explicitly unavailable.
- ZIP project analyzer: in-memory inspection, 10 MB archive limit, 1,500 entries, 50 MB expanded size, compression-ratio bound, path traversal rejection, file allowlist, project report, and persisted per-user reports. Uploaded content is never executed or extracted to disk.

## Deployment

Frontend: deploy `frontend` as the Vercel root, framework Vite, build command `npm run build`, output `dist`, and set `VITE_API_URL` to the Render API `/api` URL.

Backend: deploy `backend` as a Render Node web service with build command `npm install`, start command `npm start`, health check path `/health`; use Node.js `>=22.19.0 <25` (set `NODE_VERSION` in Render if needed), and set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (the Vercel origin), and `PORT` as needed. Keep `.env` files out of source control.

## Parser scope, MiniC execution, and tests

The editor requests `/api/languages` and displays each server parser's configured state. Parser errors return a consistent status, engine name, error count, source location, and bounded AST or concrete syntax tree. Syntax validation never compiles or executes submitted code. HTML follows parse5's HTML error recovery; it reports tokenizer/tree-construction parse errors but does not treat ordinary HTML omissions such as a missing doctype as syntax failure. SQL currently means PostgreSQL grammar, not every vendor's dialect. Tree-sitter output is explicitly labeled a concrete syntax tree; the other parser adapters expose compact ASTs. CST output is therefore unavailable for AST-only adapters.

The editor also provides **MiniC Core (Assessment)** and **MiniC Extended** parser profiles. Core follows the restricted CFG in `documentation/CFG.md`; Extended preserves the richer supported constructs. `POST /api/run` interprets parsed MiniC ASTs only, with instruction/time/output bounds. It does not run C or other external source code. Run is disabled for other languages and the API returns “Execution service is not configured.” MiniC Core `return NUMBER;` is shown as a return value and produces no stdout. Submitting a MiniC program stores its validation and interpreter result; validation alone does not create history records.

Run `npm test` in `backend` for API-level valid/invalid cases for all 12 language parsers and MiniC Core/Extended parser/interpreter cases. The tests use loopback HTTP requests and require local socket permission. Run `npm run build` in `frontend` for the production build.

The FLAT lab keeps the arithmetic grammar `E → T E′`, `E′ → + T E′ | - T E′ | ε`, `T → F T′`, `T′ → * F T′ | / F T′ | ε`, `F → ( E ) | id | number`, and adds separate MiniC Core and Extended modes. The `/dfa` page uses the same backend DFA definition as the lexical scanner. Network Monitor charts and observed alerts are derived from stored records; no-data state is explicit. The predictive recursive descent uses call-stack state as its pushdown stack and reports match/reduction steps.

## Setup notes

Registration requires a name, register/roll number, valid email, and password of at least eight characters. For legacy MongoDB accounts created before roll numbers became required, update those records before relying on account profile display. No default admin credentials are shipped; an administrator must be assigned through a trusted database operation.

Detailed grammar, security, architecture, language scope, and assessment notes are in `documentation/`.

## API notes

All `/api` routes use JSON unless uploading a project (`multipart/form-data`, field `file`). `/api/network/status` and `/health` are public health endpoints. Authenticated API calls require `Authorization: Bearer <JWT>`. API request logs omit headers and bodies. DFA routes: `GET /api/lexer/dfa` and `POST /api/lexer/dfa/simulate`.

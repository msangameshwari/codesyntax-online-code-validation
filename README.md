# CodeSyntax — Online Code Analysis and Validation

Academic MERN project demonstrating full stack development, computer networks, and formal language parsing.

## Requirements

- Node.js 20+
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
- Configured non-executing syntax parsers: Babel JavaScript/TypeScript, parse5 HTML, PostCSS CSS. All other listed languages report unsupported, with no false syntax verdict.
- JavaScript subset lexical analyzer; arithmetic expression recursive descent parser with grammar, located errors, reduction trace, and AST.
- Client request telemetry, MongoDB API logs, health endpoints, and client/server/parser flow diagram.
- ZIP project analyzer: in-memory inspection, 10 MB archive limit, 1,500 entries, 50 MB expanded size, compression-ratio bound, path traversal rejection, file allowlist, project report, and persisted per-user reports. Uploaded content is never executed or extracted to disk.

## Deployment

Frontend: deploy `frontend` as the Vercel root, framework Vite, build command `npm run build`, output `dist`, and set `VITE_API_URL` to the Render API `/api` URL.

Backend: deploy `backend` as a Render Node web service with build command `npm install`, start command `npm start`, health check path `/health`; set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (the Vercel origin), and `PORT` as needed. Keep `.env` files out of source control.

## Current parser scope

JavaScript/TypeScript parsing checks syntactic structure through Babel and HTML/CSS through their configured parsers. This does not compile, execute code, or claim static analysis beyond parser diagnostics. The FLAT lab grammar is `E → T E′`, `E′ → + T E′ | - T E′ | ε`, `T → F T′`, `T′ → * F T′ | / F T′ | ε`, `F → ( E ) | id | number`. The predictive recursive descent uses call-stack state as its pushdown stack and reports match/reduction steps.

## API notes

All `/api` routes use JSON unless uploading a project (`multipart/form-data`, field `file`). `/api/network/status` and `/health` are public health endpoints. Authenticated API calls require `Authorization: Bearer <JWT>`. API request logs omit headers and bodies.

# Existing Error Diagnosis

The project inspected is the existing React/Vite + Express/Mongoose CodeSyntax repository. The attached prompt described a Flask/SQLite project; those facts do not match this workspace, so no migration was made.

| File / area | Reproduction and issue | Change | Regression evidence |
|---|---|---|---|
| `backend/src/services/validator.js` | `POST /validate` with `source: "  \n"` was accepted by parsers that tolerate empty input. | Reject whitespace-only source and check byte limit first. | API test asserts 400 for blank and 413 for oversized source. |
| `backend/src/routes/api.js`, frontend registration | Registration lacked a required register/roll number; name/email/password failures were not field-specific. | Shared server validator requires all four values; frontend submits roll number and renders field messages. | Registration unit tests cover missing fields and normalization. |
| submission POST route | Client could submit a fabricated validation status / parser output. | The server revalidates title/language/source and builds saved result fields from parser output. | Route implementation derives status from `validateSource`; no client result fields are consumed. |
| validation workflow | Validation used to be coupled to automatic submission history. | Validate is read-only; Submit is explicit and server validates again. | API tests assert validation result shape; submission route revalidates. |
| Tree-sitter output | A concrete parse tree was called an AST. | Tree-sitter output is now returned in the `cst` field and UI labels it as CST. | Existing 12 parser API test checks AST or CST availability for valid input. |
| `backend/src/server.js` health/error handling | Health could report success while MongoDB was disconnected; malformed JSON surfaced as a generic server error. | `/health` checks Mongoose readiness; parser body errors use structured 400/413 responses and request IDs. | Manual/static code review; dedicated server middleware tests are still a gap. |
| parser lab | Only arithmetic expression parser existed; assessment Core grammar and real output were absent. | Added separate Core/Extended recursive descent profiles and bounded AST interpreter for MiniC. | Core production/invalid tests, output-difference tests, and loop bound test. |

Baseline: 31 backend tests and frontend build passed before changes. Current automated backend suite: 37 passing tests. Current Vite production build passes. API route tests use loopback sockets and may need permission in restricted environments.

Security review: no code compiler, shell, `eval`, or submitted source execution was introduced. MiniC runs as an AST interpreter with step/time/output limits. External language execution remains unavailable. Passwords are bcrypt-hashed, JWTs are not included in network logs, and history lookups remain owner-scoped. Admin creation has no shipped default credentials. ZIP upload safeguards were retained.

# Execution and Validation Security

- All language validators parse source text; they never invoke an OS compiler, shell, `eval`, or `exec` on submitted code.
- The Run action is enabled only for MiniC Core/Extended. The interpreter receives a parser-produced AST and supports explicit nodes only.
- Interpreter defaults cap execution at 20,000 steps, 100 ms elapsed time, and 16 KB of output. Loop steps are counted. Invalid syntax produces no execution.
- Non-MiniC Run requests return `Execution service is not configured.` A real isolated execution worker is required before enabling any other runtime.
- JSON requests are capped at 120 KB and individual source at 100 KB. Language IDs are allowlisted.
- Authentication uses bcrypt and signed JWTs; user history queries are owner-scoped. API logs contain no request body or authorization header.
- ZIP uploads are inspected in memory with configured size/count/expanded-size/path safeguards; contents are not executed.

Production deployment should use HTTPS, a long random `JWT_SECRET`, a restricted MongoDB database user, and exact `CLIENT_ORIGIN` values.

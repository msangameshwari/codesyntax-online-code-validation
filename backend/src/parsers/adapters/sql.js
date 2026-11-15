import { parse } from 'pgsql-ast-parser';
export function validateSql(source) {
  const ast = parse(source);
  return { errors: [], ast, engine: 'pgsql-ast-parser (PostgreSQL SQL grammar)' };
}

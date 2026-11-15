import { parse } from '@babel/parser';
export function validateTypeScript(source) {
  const ast = parse(source, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'] });
  return { errors: [], ast: ast.program, engine: 'Babel TypeScript parser' };
}

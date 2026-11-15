import { parse } from '@babel/parser';
export function validateJavaScript(source) {
  const ast = parse(source, { sourceType: 'unambiguous', plugins: ['jsx'] });
  return { errors: [], ast: ast.program, engine: 'Babel JavaScript parser' };
}

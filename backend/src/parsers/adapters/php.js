import PhpParser from 'php-parser';
const engine = new PhpParser.Engine({ parser: { suppressErrors: false }, ast: { withPositions: true } });
export function validatePhp(source) {
  const ast = engine.parseCode(source);
  return { errors: [], ast, engine: 'PHP-Parser PHP grammar' };
}

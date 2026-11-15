import postcss from 'postcss';
export function validateCss(source) {
  const ast = postcss.parse(source);
  return { errors: [], ast, engine: 'PostCSS parser' };
}

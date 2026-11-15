import { parse } from 'parse5';
export function validateHtml(source) {
  const errors = [];
  const ast = parse(source, { onParseError: (error) => {
    if (error.code !== 'missing-doctype') errors.push({ message: error.code.replaceAll('-', ' '), line: error.startLine, column: error.startCol });
  } });
  return { errors, ast, engine: 'parse5 HTML parser' };
}

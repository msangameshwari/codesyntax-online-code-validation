import { validateJavaScript } from '../parsers/adapters/javascript.js';
import { validateTypeScript } from '../parsers/adapters/typescript.js';
import { validateHtml } from '../parsers/adapters/html.js';
import { validateCss } from '../parsers/adapters/css.js';
import { validatePython } from '../parsers/adapters/python.js';
import { validateC } from '../parsers/adapters/c.js';
import { validateCpp } from '../parsers/adapters/cpp.js';
import { validateJava } from '../parsers/adapters/java.js';
import { validatePhp } from '../parsers/adapters/php.js';
import { validateCsharp } from '../parsers/adapters/csharp.js';
import { validateGo } from '../parsers/adapters/go.js';
import { validateSql } from '../parsers/adapters/sql.js';
import { compactAst } from '../parsers/ast.js';
import { checkTreeSitterGrammars } from '../parsers/treeSitter.js';

const definitions = [
  { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.jsx'], parser: 'Babel JavaScript parser', validate: validateJavaScript },
  { id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'], parser: 'Babel TypeScript parser', validate: validateTypeScript },
  { id: 'html', name: 'HTML', extensions: ['.html', '.htm'], parser: 'parse5 HTML parser', validate: validateHtml },
  { id: 'css', name: 'CSS', extensions: ['.css'], parser: 'PostCSS parser', validate: validateCss },
  { id: 'python', name: 'Python', extensions: ['.py'], parser: 'Tree-sitter Python grammar (WASM)', validate: validatePython },
  { id: 'c', name: 'C', extensions: ['.c', '.h'], parser: 'Tree-sitter C grammar (WASM)', validate: validateC },
  { id: 'cpp', name: 'C++', extensions: ['.cc', '.cpp', '.cxx', '.hpp', '.h'], parser: 'Tree-sitter C++ grammar (WASM)', validate: validateCpp },
  { id: 'java', name: 'Java', extensions: ['.java'], parser: 'Tree-sitter Java grammar (WASM)', validate: validateJava },
  { id: 'php', name: 'PHP', extensions: ['.php'], parser: 'PHP-Parser PHP grammar', validate: validatePhp },
  { id: 'csharp', name: 'C#', extensions: ['.cs'], parser: 'Tree-sitter C# grammar (WASM)', validate: validateCsharp },
  { id: 'go', name: 'Go', extensions: ['.go'], parser: 'Tree-sitter Go grammar (WASM)', validate: validateGo },
  { id: 'sql', name: 'SQL (PostgreSQL)', extensions: ['.sql'], parser: 'pgsql-ast-parser (PostgreSQL SQL grammar)', validate: validateSql },
];
const byId = new Map(definitions.map((item) => [item.id, item]));
let catalogPromise;

export async function getLanguageCatalog() {
  catalogPromise ??= (async () => {
    const treeStatus = await checkTreeSitterGrammars();
    return definitions.map((language) => {
      const grammarId = ({ c: 'c', cpp: 'cpp', csharp: 'csharp', go: 'go', java: 'java', python: 'python' })[language.id];
      const grammarStatus = grammarId ? treeStatus[grammarId] : null;
      return { id: language.id, name: language.name, extensions: language.extensions, parser: language.parser, supported: grammarStatus?.supported ?? true, ...(grammarStatus?.error ? { error: grammarStatus.error } : {}) };
    });
  })();
  return catalogPromise;
}

function syntaxError(error) {
  const message = String(error.message || 'Invalid syntax').split('\n')[0];
  const parserLocation = message.match(/line\s+(\d+)\s+col(?:umn)?\s+(\d+)/i);
  const line = parserLocation ? Number(parserLocation[1]) : error.loc?.line ?? error.lineNumber ?? error.line ?? 1;
  const column = parserLocation ? Number(parserLocation[2]) : error.loc?.column != null ? error.loc.column + 1 : error.columnNumber ?? error.column ?? 1;
  return { message: message.slice(0, 500), line, column };
}

export async function validateSource(languageId, source) {
  const definition = byId.get(languageId);
  if (!definition) return { ok: false, statusCode: 400, error: 'Unknown language identifier' };
  if (typeof source !== 'string') return { ok: false, statusCode: 400, error: 'Source must be a string' };
  if (Buffer.byteLength(source, 'utf8') > 100_000) return { ok: false, statusCode: 413, error: 'Source limit is 100 KB' };
  const catalog = await getLanguageCatalog();
  const language = catalog.find((item) => item.id === languageId);
  if (!language?.supported) return { ok: false, statusCode: 422, error: `${definition.name} parser is unavailable`, parser: language?.error || null };
  const startedAt = performance.now();
  try {
    const parsed = await definition.validate(source);
    const errors = parsed.errors || [];
    return { ok: true, result: { language: languageId, status: errors.length ? 'invalid' : 'valid', errors, errorCount: errors.length, warnings: [], processingMs: +(performance.now() - startedAt).toFixed(2), engine: parsed.engine || definition.parser, ast: compactAst(parsed.ast) } };
  } catch (error) {
    return { ok: true, result: { language: languageId, status: 'invalid', errors: [syntaxError(error)], errorCount: 1, warnings: [], processingMs: +(performance.now() - startedAt).toFixed(2), engine: definition.parser, ast: null } };
  }
}

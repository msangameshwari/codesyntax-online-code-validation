const ignored = new Set(['loc', 'range', 'start', 'end', 'parent', 'tokens', 'comments', 'leadingComments', 'trailingComments', 'extra', 'errors', 'raw']);

export function compactAst(input, maxNodes = 500) {
  const budget = { remaining: maxNodes };
  const seen = new WeakSet();
  function visit(value, depth = 0) {
    if (value == null || typeof value !== 'object') return undefined;
    if (Array.isArray(value)) {
      const result = [];
      for (const item of value) {
        if (budget.remaining <= 0) { result.push({ type: 'truncated' }); break; }
        const parsed = visit(item, depth); if (parsed) result.push(parsed);
      }
      return result;
    }
    if (seen.has(value) || budget.remaining <= 0) return { type: 'truncated' };
    const label = value.type || value.kind || value.nodeName || value.tagName;
    if (typeof label !== 'string') return undefined;
    seen.add(value); budget.remaining--;
    const node = { type: label };
    for (const key of ['name', 'value', 'selector', 'prop', 'tagName']) {
      if (typeof value[key] === 'string' || typeof value[key] === 'number') node[key] = String(value[key]).slice(0, 100);
    }
    const children = [];
    for (const [key, child] of Object.entries(value)) {
      if (ignored.has(key) || ['name', 'value', 'selector', 'prop', 'tagName'].includes(key)) continue;
      if (depth >= 14) { if (Array.isArray(child) || child?.type || child?.kind || child?.nodeName) node.truncated = true; continue; }
      if (Array.isArray(child)) {
        for (const item of child) { const parsed = visit(item, depth + 1); if (parsed) children.push(parsed); }
      } else if (child && typeof child === 'object') {
        const parsed = visit(child, depth + 1); if (parsed) children.push(parsed);
      }
      if (budget.remaining <= 0) { node.truncated = true; break; }
    }
    if (children.length) node.children = children;
    return node;
  }
  return visit(input);
}

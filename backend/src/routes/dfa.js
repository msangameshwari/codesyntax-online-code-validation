import { Router } from 'express';
import { dfaDefinition } from '../analyzers/dfa.js';
import { scanWithDfa } from '../analyzers/lexer.js';
import { auth } from '../middleware/auth.js';

export function createDfaRouter({ authorize = auth } = {}) {
  const router = Router();
  router.get('/', authorize, (_req, res) => res.json(dfaDefinition));
  router.post('/simulate', authorize, (req, res) => {
    const { source } = req.body || {};
    if (typeof source !== 'string') return res.status(400).json({ error: 'Source must be text.' });
    if (Buffer.byteLength(source, 'utf8') > 100_000) return res.status(413).json({ error: 'Source limit is 100 KB.' });
    const result = scanWithDfa(source);
    return res.json({ ...result, trace: result.trace.slice(0, 2_000), traceTruncated: result.trace.length > 2_000 });
  });
  return router;
}

export default createDfaRouter();

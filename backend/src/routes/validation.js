import { Router } from 'express';
import { Submission } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { validateSource } from '../services/validator.js';

export function createValidationRouter({ authorize = auth, saveSubmission = (record) => Submission.create(record) } = {}) {
  const router = Router();
  router.post('/', authorize, async (req, res, next) => {
    try {
      const { language, source = '' } = req.body || {};
      const checked = await validateSource(language, source);
      if (!checked.ok) return res.status(checked.statusCode).json({ error: checked.error, ...(checked.parser ? { parser: checked.parser } : {}) });
      const result = checked.result;
      if (req.user) {
        const saved = await saveSubmission({ student: req.user.id, language: result.language, source, status: result.status, errorCount: result.errorCount, errors: result.errors, warnings: result.warnings, processingMs: result.processingMs, engine: result.engine, ast: result.ast });
        result.submissionId = saved.id;
      }
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });
  return router;
}

export default createValidationRouter();

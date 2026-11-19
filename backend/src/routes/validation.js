import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validateSource } from '../services/validator.js';

export function createValidationRouter({ authorize = auth } = {}) {
  const router = Router();
  router.post('/', authorize, async (req, res, next) => {
    try {
      const { language, source = '' } = req.body || {};
      const checked = await validateSource(language, source);
      if (!checked.ok) return res.status(checked.statusCode).json({ error: checked.error, ...(checked.fields ? { fields: checked.fields } : {}), ...(checked.parser ? { parser: checked.parser } : {}) });
      return res.json(checked.result);
    } catch (error) {
      return next(error);
    }
  });
  return router;
}

export default createValidationRouter();

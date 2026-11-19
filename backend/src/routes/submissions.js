import { Router } from 'express';
import { Submission } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { validateSource } from '../services/validator.js';
import { parseMiniC, runMiniC } from '../parsers/minic.js';

export function createSubmissionRouter({ authorize = auth, validate = validateSource, saveSubmission = (record) => Submission.create(record) } = {}) {
  const router = Router();
  router.post('/', authorize, async (req, res, next) => {
    try {
      const { title, language, source } = req.body || {};
      const fields = {};
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) fields.title = 'Enter a title (up to 120 characters).';
      if (typeof language !== 'string' || !language.trim()) fields.language = 'Select a language or parser profile.';
      if (typeof source !== 'string' || !source.trim()) fields.source = 'Enter source code before submitting.';
      if (Object.keys(fields).length) return res.status(400).json({ error: 'Check the highlighted fields.', fields });

      const checked = await validate(language, source);
      if (!checked.ok) return res.status(checked.statusCode).json({ error: checked.error, ...(checked.fields ? { fields: checked.fields } : {}), ...(checked.parser ? { parser: checked.parser } : {}) });
      const result = checked.result;
      let execution = null;
      if (['minic-core', 'minic-extended'].includes(language)) {
        const parsed = parseMiniC(source, language === 'minic-core' ? 'core' : 'extended');
        if (parsed.valid) execution = runMiniC(parsed.ast);
      }
      const record = {
        student: req.user.id,
        title: title.trim(),
        language: result.language,
        source,
        status: result.status,
        errorCount: result.errorCount,
        errors: result.errors,
        warnings: result.warnings,
        tokens: result.tokens,
        cst: result.cst,
        ast: result.ast,
        parserTrace: result.trace,
        processingMs: result.processingMs,
        engine: result.engine,
        profile: ['minic-core', 'minic-extended'].includes(language) ? language : undefined,
        output: execution?.output ?? null,
        returnValue: execution?.returnValue ?? null,
        execution: execution ? { ok: execution.ok, error: execution.error, exitCode: execution.exitCode, runtimeMs: execution.runtimeMs, timedOut: execution.timedOut } : null,
      };
      const saved = await saveSubmission(record);
      const value = typeof saved?.toObject === 'function' ? saved.toObject() : saved;
      return res.status(201).json({ ...value, requestId: req.requestId || null });
    } catch (error) {
      return next(error);
    }
  });
  return router;
}

export default createSubmissionRouter();

import { parseTreeSitter } from '../treeSitter.js';
export const validateCsharp = (source) => parseTreeSitter('csharp', source);

import { parseTreeSitter } from '../treeSitter.js';
export const validatePython = (source) => parseTreeSitter('python', source);

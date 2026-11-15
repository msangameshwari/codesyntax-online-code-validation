import { parseTreeSitter } from '../treeSitter.js';
export const validateCpp = (source) => parseTreeSitter('cpp', source);

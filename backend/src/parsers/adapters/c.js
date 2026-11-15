import { parseTreeSitter } from '../treeSitter.js';
export const validateC = (source) => parseTreeSitter('c', source);

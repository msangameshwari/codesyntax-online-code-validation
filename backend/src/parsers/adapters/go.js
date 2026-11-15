import { parseTreeSitter } from '../treeSitter.js';
export const validateGo = (source) => parseTreeSitter('go', source);

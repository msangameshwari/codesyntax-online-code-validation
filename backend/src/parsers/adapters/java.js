import { parseTreeSitter } from '../treeSitter.js';
export const validateJava = (source) => parseTreeSitter('java', source);

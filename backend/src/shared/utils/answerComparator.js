import AppError from '../errors/AppError.js';

const FLOAT_REGEX = /^[+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:[eE][+-]?\d+)?$/;
const REL_TOLERANCE = 1e-9;
const ABS_TOLERANCE = 1e-9;

export const normalizeOutput = (output) => {
  if (output === null || output === undefined) return '';

  const unified = String(output).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = unified.split('\n').map((line) => line.replace(/\s+$/g, ''));
  const filtered = lines.filter((line) => line.length > 0);

  return filtered.join('\n').trim();
};

const isNumericToken = (token) => {
  if (!token) return false;
  const cleaned = token.replace(/[,;]$/, '');
  return FLOAT_REGEX.test(cleaned);
};

const toNumber = (token) => Number(token.replace(/[,;]$/, ''));

export const floatsClose = (a, b) => {
  const diff = Math.abs(a - b);
  const denom = Math.max(Math.abs(a), Math.abs(b));

  if (denom < ABS_TOLERANCE) {
    return diff < ABS_TOLERANCE;
  }
  return diff / denom < REL_TOLERANCE;
};

const tokenize = (normalized) =>
  normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * 예상 출력과 실제 출력을 비교합니다.
 * - trailing whitespace, 빈 줄, CRLF/LF 차이를 무시합니다.
 * - 숫자 토큰은 상대 오차 1e-9(0 근처 절대 오차 1e-9) 허용합니다.
 * @param {string} expected 예상 출력
 * @param {string} actual 실제 출력
 * @returns {{matched: boolean, mismatchIndex?: number}}
 */
export const compareOutputs = (expected, actual) => {
  const normExpected = normalizeOutput(expected);
  const normActual = normalizeOutput(actual);

  const expectedTokens = tokenize(normExpected);
  const actualTokens = tokenize(normActual);

  if (expectedTokens.length !== actualTokens.length) {
    return { matched: false, mismatchIndex: Math.min(expectedTokens.length, actualTokens.length) };
  }

  for (let i = 0; i < expectedTokens.length; i += 1) {
    const eToken = expectedTokens[i];
    const aToken = actualTokens[i];

    const eIsNum = isNumericToken(eToken);
    const aIsNum = isNumericToken(aToken);

    if (eIsNum && aIsNum) {
      const eNum = toNumber(eToken);
      const aNum = toNumber(aToken);
      if (!floatsClose(eNum, aNum)) {
        return { matched: false, mismatchIndex: i };
      }
    } else if (eToken !== aToken) {
      return { matched: false, mismatchIndex: i };
    }
  }

  return { matched: true };
};

export const assertOutputsMatch = (expected, actual) => {
  const result = compareOutputs(expected, actual);
  if (!result.matched) {
    throw new AppError('출력이 일치하지 않습니다.', 400, 'OUTPUT_MISMATCH');
  }
  return true;
};

export default {
  normalizeOutput,
  floatsClose,
  compareOutputs,
  assertOutputsMatch,
};

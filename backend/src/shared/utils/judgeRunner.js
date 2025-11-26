import logger from './logger.js';
import { analyzePythonCode } from './pythonAstValidator.js';
import { runIsolatedPython } from './pythonExecutionEngine.js';
import { compareOutputs, normalizeOutput } from './answerComparator.js';
import AppError from '../errors/AppError.js';

const STATUSES = ['AC', 'WA', 'TLE', 'RE', 'SE', 'MLE'];

const sortTestCases = (cases = []) => {
  const publicCases = [];
  const privateCases = [];
  cases.forEach((tc) => {
    if (tc?.isPublic) publicCases.push(tc);
    else privateCases.push(tc);
  });
  return [...publicCases, ...privateCases];
};

const judgeSingleCase = async (code, testCase, options) => {
  const {
    defaultTimeLimitSeconds = undefined,
    defaultMemoryLimitMB = undefined,
    pythonExecutable = undefined,
    tempDir = undefined,
  } = options || {};

  const execResult = await runIsolatedPython({
    code,
    stdin: testCase.input ?? '',
    timeLimitSeconds: testCase.timeLimitSeconds ?? defaultTimeLimitSeconds,
    memoryLimitMB: testCase.memoryLimitMB ?? defaultMemoryLimitMB,
    pythonExecutable,
    tempDir,
  }).catch((err) => {
    logger.error('채점 실행 중 오류', { error: err.message });
    return {
      status: 'RE',
      stdout: '',
      stderr: err.message,
      timeMs: 0,
      memoryBytes: 0,
      returnCode: -1,
    };
  });

  const caseResult = {
    status: execResult.status,
    stdout: execResult.stdout ?? '',
    stderr: execResult.stderr ?? '',
    timeMs: execResult.timeMs ?? 0,
    memoryBytes: execResult.memoryBytes ?? 0,
    returnCode: execResult.returnCode ?? 0,
    input: testCase.input ?? '',
    expectedOutput: normalizeOutput(testCase.expectedOutput ?? ''),
  };

  if (execResult.status === 'OK') {
    const compare = compareOutputs(testCase.expectedOutput ?? '', execResult.stdout ?? '');
    if (compare.matched) {
      caseResult.status = 'AC';
    } else {
      caseResult.status = 'WA';
      caseResult.mismatchIndex = compare.mismatchIndex;
    }
  }

  return caseResult;
};

export const judgeSubmission = async ({
  code,
  testCases,
  failFast = true,
  defaultTimeLimitSeconds,
  defaultMemoryLimitMB,
  pythonExecutable,
  tempDir,
} = {}) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new AppError('테스트 케이스가 없습니다.', 400, 'NO_TEST_CASES');
  }

  // AST 검증 (SE 처리)
  const astResult = analyzePythonCode(code, { pythonExecutable });
  if (astResult.status !== 'OK') {
    return {
      status: 'SE',
      passedCount: 0,
      totalCount: testCases.length,
      maxTimeMs: 0,
      avgTimeMs: 0,
      maxMemoryBytes: 0,
      avgMemoryBytes: 0,
      errorMessage: astResult.message || '문법 오류 또는 금지 모듈 사용',
      caseResults: [],
    };
  }

  const orderedCases = sortTestCases(testCases);
  const caseResults = [];
  let passedCount = 0;
  let errorMessage = null;
  let maxTimeMs = 0;
  let totalTimeMs = 0;
  let maxMemoryBytes = 0;
  let totalMemoryBytes = 0;
  let finalStatus = 'AC';

  for (const tc of orderedCases) {
    const result = await judgeSingleCase(code, tc, {
      defaultTimeLimitSeconds,
      defaultMemoryLimitMB,
      pythonExecutable,
      tempDir,
    });

    caseResults.push(result);

    maxTimeMs = Math.max(maxTimeMs, result.timeMs);
    totalTimeMs += result.timeMs;
    maxMemoryBytes = Math.max(maxMemoryBytes, result.memoryBytes);
    totalMemoryBytes += result.memoryBytes;

    if (result.status === 'AC') {
      passedCount += 1;
    } else if (finalStatus === 'AC') {
      finalStatus = result.status;
      errorMessage = result.stderr || '채점 실패';
      if (failFast) break;
    }
  }

  const totalCount = testCases.length;

  // 누락된 케이스가 있다면 실패로 간주
  if (caseResults.length < totalCount && finalStatus === 'AC') {
    finalStatus = 'WA';
  }

  return {
    status: finalStatus,
    passedCount,
    totalCount,
    maxTimeMs,
    avgTimeMs: totalTimeMs / caseResults.length,
    maxMemoryBytes,
    avgMemoryBytes: totalMemoryBytes / caseResults.length,
    errorMessage,
    caseResults,
  };
};

export default judgeSubmission;

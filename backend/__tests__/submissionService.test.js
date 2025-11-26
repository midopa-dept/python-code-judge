import { jest } from '@jest/globals';
import { createSubmissionService } from '../src/modules/submissions/services/submissionService.js';
import { extractSubmissionCode } from '../src/modules/submissions/controllers/submissionController.js';
import AppError, { ValidationError } from '../src/shared/errors/AppError.js';

const baseProblemRow = {
  id: 1,
  title: '더하기',
  visibility: 'public',
  time_limit: 5,
  memory_limit: 256,
};

const createClientMock = (handlers = {}) => {
  const query = jest.fn(async (sql) => {
    if (sql.includes('FROM problems')) return { rows: [handlers.problemRow || baseProblemRow] };
    if (sql.includes('submitted_at')) return { rows: handlers.duplicateRows || [] };
    if (sql.includes('INSERT INTO submissions')) return { rows: [{ id: handlers.insertId || 99 }] };
    return { rows: [] };
  });

  return {
    query,
    release: jest.fn(),
  };
};

describe('extractSubmissionCode', () => {
  test('본문 코드 문자열을 반환한다', () => {
    const req = { body: { code: 'print("hi")' } };
    expect(extractSubmissionCode(req)).toBe('print("hi")');
  });

  test('.py 파일을 읽어 UTF-8 문자열로 반환한다', () => {
    const req = {
      body: {},
      file: { originalname: 'main.py', buffer: Buffer.from('print(1)', 'utf8') },
    };
    expect(extractSubmissionCode(req)).toBe('print(1)');
  });

  test('.py 확장자가 아니면 ValidationError', () => {
    const req = {
      body: {},
      file: { originalname: 'hack.txt', buffer: Buffer.from('print(1)', 'utf8') },
    };
    expect(() => extractSubmissionCode(req)).toThrow(ValidationError);
  });

  test('코드가 없으면 ValidationError', () => {
    const req = { body: {} };
    expect(() => extractSubmissionCode(req)).toThrow(ValidationError);
  });
});

describe('submissionService.submitCode', () => {
  test('미지원 Python 버전은 ValidationError', async () => {
    const service = createSubmissionService({
      getDbClient: async () => createClientMock(),
    });

    await expect(
      service.submitCode({
        studentId: 1,
        userRole: 'student',
        problemId: 1,
        code: 'print(1)',
        pythonVersion: '2.7',
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('5초 내 중복 제출이면 429 오류', async () => {
    const client = createClientMock({ duplicateRows: [{ exists: 1 }] });
    const service = createSubmissionService({
      getDbClient: async () => client,
    });

    await expect(
      service.submitCode({
        studentId: 1,
        userRole: 'student',
        problemId: 1,
        code: 'print(1)',
        pythonVersion: '3.10',
      })
    ).rejects.toMatchObject({ statusCode: 429, errorCode: 'DUPLICATE_SUBMISSION' });
    expect(client.query).toHaveBeenCalled();
  });

  test('AST 거부 시 SE 상태로 기록하고 즉시 반환', async () => {
    const client = createClientMock({ insertId: 123 });
    const service = createSubmissionService({
      getDbClient: async () => client,
      analyzeCode: () => ({ status: 'REJECTED', errors: [{ type: 'BANNED_MODULE', target: 'os' }] }),
    });

    const result = await service.submitCode({
      studentId: 2,
      userRole: 'student',
      problemId: 1,
      code: 'import os',
      pythonVersion: '3.10',
    });

    expect(result.status).toBe('SE');
    expect(result.submissionId).toBe(123);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('COMMIT'));
  });

  test('정상 제출 시 pending 반환 후 비동기 채점 업데이트', async () => {
    const client = createClientMock({ insertId: 321 });
    const runQuery = jest.fn(async (sql) => {
      if (sql.includes('FROM test_cases')) {
        return {
          rows: [
            {
              id: 1,
              input_data: '1 2',
              expected_output: '3',
              is_public: true,
              test_order: 1,
            },
          ],
        };
      }
      return { rows: [] };
    });

    const judge = jest.fn(async () => ({
      status: 'AC',
      passedCount: 1,
      totalCount: 1,
      maxTimeMs: 12,
      maxMemoryBytes: 1024,
    }));

    const service = createSubmissionService({
      getDbClient: async () => client,
      analyzeCode: () => ({ status: 'OK', passed: true }),
      judge,
      runQuery,
    });

    const result = await service.submitCode({
      studentId: 3,
      userRole: 'student',
      problemId: 1,
      code: 'print(sum(map(int, input().split())))',
      pythonVersion: '3.11',
    });

    expect(result.status).toBe('pending');
    expect(result.submissionId).toBe(321);

    // 비동기 채점 완료까지 대기
    await new Promise((resolve) => setImmediate(resolve));

    expect(judge).toHaveBeenCalled();
    expect(runQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE submissions'),
      expect.arrayContaining(['AC'])
    );
  });
});

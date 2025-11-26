import { jest } from '@jest/globals';
import { createSubmissionService } from '../src/modules/submissions/services/submissionService.js';
import { extractSubmissionCode } from '../src/modules/submissions/controllers/submissionController.js';
import AppError, { ValidationError, ForbiddenError } from '../src/shared/errors/AppError.js';

const baseProblemRow = {
  id: 1,
  title: '더하기',
  visibility: 'public',
  time_limit: 5,
  memory_limit: 256,
};

  const createClientMock = (handlers = {}) => {
    const query = jest.fn(async (sql, params) => {
      const upper = sql.trim().toUpperCase();
      if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') return { rows: [] };

      if (sql.includes('FROM problems')) return { rows: [handlers.problemRow || baseProblemRow] };
      if (sql.includes('SELECT id, student_id, session_id, problem_id, submitted_at')) {
        return {
          rows: [
            {
              id: handlers.metaId || handlers.insertId || 99,
              student_id: handlers.studentId || 1,
              session_id: handlers.sessionId || null,
              problem_id: handlers.problemId || 1,
              submitted_at: handlers.submittedAt || '2025-01-01T00:00:00Z',
            },
          ],
        };
      }
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
    const clientUpdates = client.query.mock.calls.filter(([sql]) => sql.includes('UPDATE submissions'));
    expect(clientUpdates.some(([, params]) => params?.includes('AC'))).toBe(true);
  });
});

describe('submissionService.getSubmissions', () => {
  test('학생은 본인 제출만 조회하도록 studentId 필터를 덮어쓴다', async () => {
    const runQuery = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            student_id: 1,
            student_name: '학생A',
            problem_id: 2,
            problem_title: '문제',
            status: 'AC',
            execution_time: 12,
            memory_usage: 1024,
            submitted_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

    const service = createSubmissionService({ runQuery });

    const result = await service.getSubmissions(
      { studentId: 999, limit: 5, offset: 0 },
      { role: 'student', id: 1 }
    );

    // 첫 쿼리 파라미터로 본인 ID가 사용됨
    expect(runQuery.mock.calls[0][1][0]).toBe(1);
    expect(result.submissions[0].studentId).toBe(1);
    expect(result.pagination.limit).toBe(5);
  });

  test('관리자는 studentId 필터를 사용할 수 있다', async () => {
    const runQuery = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 11,
            student_id: 5,
            student_name: '학생B',
            problem_id: 3,
            problem_title: '문제2',
            status: 'WA',
            execution_time: 30,
            memory_usage: 2048,
            submitted_at: '2025-01-02T00:00:00Z',
          },
        ],
      });

    const service = createSubmissionService({ runQuery });

    await service.getSubmissions({ studentId: 5, limit: 10, offset: 0 }, { role: 'admin', id: 99 });

    // COUNT 쿼리 파라미터로 필터 값이 전달됨
    expect(runQuery.mock.calls[0][1]).toEqual([5]);
  });

  test('지원하지 않는 상태값이면 ValidationError', async () => {
    const service = createSubmissionService({ runQuery: jest.fn() });
    await expect(
      service.getSubmissions({ status: 'UNKNOWN' }, { role: 'admin', id: 1 })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('submissionService.getSubmissionResult', () => {
  test('본인 제출이 아니면 ForbiddenError', async () => {
    const runQuery = jest.fn().mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          student_id: 2,
          student_name: '학생B',
          problem_id: 3,
          problem_title: '문제3',
          status: 'AC',
          passed_cases: 3,
          total_cases: 3,
          execution_time: 10,
          memory_usage: 512,
          error_message: null,
          submitted_at: '2025-01-03T00:00:00Z',
          judged_at: '2025-01-03T00:01:00Z',
        },
      ],
    });

    const service = createSubmissionService({ runQuery });

    await expect(service.getSubmissionResult(20, { role: 'student', id: 1 })).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  test('채점 결과를 상세히 반환한다', async () => {
    const runQuery = jest.fn().mockResolvedValueOnce({
      rows: [
        {
          id: 21,
          student_id: 1,
          student_name: '학생A',
          problem_id: 4,
          problem_title: '문제4',
          status: 'WA',
          passed_cases: 1,
          total_cases: 3,
          execution_time: 55,
          memory_usage: 4096,
          error_message: '틀렸습니다',
          submitted_at: '2025-01-04T00:00:00Z',
          judged_at: '2025-01-04T00:01:00Z',
        },
      ],
    });

    const service = createSubmissionService({ runQuery });

    const detail = await service.getSubmissionResult(21, { role: 'student', id: 1 });

    expect(detail.status).toBe('WA');
    expect(detail.passedCases).toBe(1);
    expect(detail.totalCases).toBe(3);
    expect(detail.problemTitle).toBe('문제4');
  });
});

describe('submissionService.applyJudgeResult', () => {
  const problemMeta = { time_limit: 5, memory_limit: 256 };
  const baseSubmission = {
    id: 1,
    student_id: 10,
    session_id: 99,
    problem_id: 5,
    submitted_at: '2025-01-01T00:00:00Z',
  };

  const buildClient = (overrides = {}) => {
    const rankingRows = overrides.rankingRows || [
      { student_id: 10, score: 2, first_ac_time: '2025-01-01T00:00:00Z' },
      { student_id: 11, score: 1, first_ac_time: '2025-01-02T00:00:00Z' },
    ];

    const query = jest.fn(async (sql, params) => {
      if (sql.trim().toUpperCase() === 'BEGIN' || sql.trim().toUpperCase() === 'COMMIT' || sql.trim().toUpperCase() === 'ROLLBACK') {
        return { rows: [] };
      }

      if (sql.includes('FROM submissions') && sql.includes('WHERE id =')) {
        return { rows: [overrides.meta || baseSubmission] };
      }

      if (sql.includes('FROM submissions') && sql.includes("status = 'AC'") && sql.includes('id <>')) {
        return { rows: overrides.priorAcRows || [] };
      }

      if (sql.includes('INSERT INTO scoreboards')) {
        return { rows: [] };
      }

      if (sql.includes('FROM scoreboards sb')) {
        return { rows: rankingRows };
      }

      if (sql.includes('UPDATE scoreboards SET rank')) {
        return { rows: [] };
      }

      if (sql.includes('UPDATE submissions')) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    return {
      query,
      release: jest.fn(),
    };
  };

  test('AC 결과는 스코어보드를 갱신하고 순위를 재계산한다', async () => {
    const client = buildClient();
    const service = createSubmissionService({
      getDbClient: async () => client,
    });

    await service.applyJudgeResult(1, { status: 'AC', passedCount: 1, totalCount: 1 }, problemMeta);

    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO scoreboards'), expect.any(Array));
    const rankUpdates = client.query.mock.calls.filter(([sql]) => sql.includes('UPDATE scoreboards'));
    expect(rankUpdates).toHaveLength(2);
    expect(rankUpdates[0][1][0]).toBe(1);
  });

  test('이미 동일 문제를 AC 했다면 스코어보드를 건드리지 않는다', async () => {
    const client = buildClient({ priorAcRows: [{ exists: 1 }] });
    const service = createSubmissionService({
      getDbClient: async () => client,
    });

    await service.applyJudgeResult(1, { status: 'AC', passedCount: 1, totalCount: 1 }, problemMeta);

    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO scoreboards'), expect.any(Array));
  });

  test('AC가 아닌 결과는 스코어보드를 갱신하지 않는다', async () => {
    const client = buildClient();
    const service = createSubmissionService({
      getDbClient: async () => client,
    });

    await service.applyJudgeResult(1, { status: 'WA', passedCount: 0, totalCount: 1 }, problemMeta);

    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO scoreboards'), expect.any(Array));
    const rankUpdates = client.query.mock.calls.filter(([sql]) => sql.includes('UPDATE scoreboards'));
    expect(rankUpdates).toHaveLength(0);
  });
});

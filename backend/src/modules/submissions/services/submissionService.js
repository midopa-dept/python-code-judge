import { getClient, query as defaultQuery } from '../../../config/database.js';
import { analyzePythonCode as defaultAnalyze } from '../../../shared/utils/pythonAstValidator.js';
import { judgeSubmission as defaultJudge } from '../../../shared/utils/judgeRunner.js';
import logger from '../../../shared/utils/logger.js';
import AppError, { ValidationError, NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

export const MAX_CODE_BYTES = 64 * 1024;
export const SUPPORTED_PYTHON_VERSIONS = ['3.8', '3.9', '3.10', '3.11', '3.12'];
const DUP_WINDOW_SECONDS = 5;
const ALLOWED_STATUSES = ['AC', 'WA', 'TLE', 'RE', 'SE', 'MLE', 'pending', 'judging'];

const buildAstErrorMessage = (astResult) => {
  if (astResult?.message) return astResult.message;
  if (Array.isArray(astResult?.errors) && astResult.errors.length > 0) {
    const bannedModules = astResult.errors
      .filter((e) => e.type === 'BANNED_MODULE')
      .map((e) => e.target)
      .join(', ');
    if (bannedModules) {
      return `금지된 모듈 사용 감지: ${bannedModules}`;
    }
    const bannedFunctions = astResult.errors
      .filter((e) => e.type === 'BANNED_FUNCTION')
      .map((e) => e.target)
      .join(', ');
    if (bannedFunctions) {
      return `금지된 함수 사용 감지: ${bannedFunctions}`;
    }
    return 'AST 검증에 실패했습니다.';
  }
  return 'AST 검증에 실패했습니다.';
};

/**
 * 의존성을 주입 가능한 제출 서비스 생성
 */
export const createSubmissionService = (deps = {}) => {
  const {
    getDbClient = getClient,
    runQuery = defaultQuery,
    analyzeCode = defaultAnalyze,
    judge = defaultJudge,
    log = logger,
  } = deps;

  const fetchProblem = async (client, problemId, userRole) => {
    const result = await client.query(
      `
      SELECT id, title, visibility, time_limit, memory_limit
      FROM problems
      WHERE id = $1
    `,
      [problemId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    const problem = result.rows[0];

    if (userRole === 'student' && problem.visibility !== 'public') {
      throw new ForbiddenError('비공개 문제는 제출할 수 없습니다.');
    }

    return problem;
  };

  const checkDuplicateSubmission = async (client, studentId, problemId) => {
    const duplicate = await client.query(
      `
      SELECT 1
      FROM submissions
      WHERE student_id = $1
        AND problem_id = $2
        AND submitted_at >= NOW() - INTERVAL '${DUP_WINDOW_SECONDS} seconds'
      LIMIT 1
    `,
      [studentId, problemId]
    );

    if (duplicate.rows.length > 0) {
      throw new AppError('동일 문제는 5초 이내에 다시 제출할 수 없습니다.', 429, 'DUPLICATE_SUBMISSION');
    }
  };

  const insertSubmission = async (client, data) => {
    const result = await client.query(
      `
      INSERT INTO submissions (
        student_id,
        problem_id,
        session_id,
        code,
        code_size,
        status,
        python_version,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        data.studentId,
        data.problemId,
        data.sessionId || null,
        data.code,
        data.codeSize,
        data.status,
        data.pythonVersion,
        data.errorMessage || null,
      ]
    );

    return result.rows[0].id;
  };

  const updateSubmissionResult = async (
    submissionId,
    result,
    problemTimeLimit,
    problemMemoryLimit
  ) => {
    await runQuery(
      `
      UPDATE submissions
      SET
        status = $1,
        execution_time = $2,
        memory_usage = $3,
        error_message = $4,
        passed_cases = $5,
        total_cases = $6,
        judged_at = NOW()
      WHERE id = $7
    `,
      [
        result.status,
        result.maxTimeMs ?? problemTimeLimit * 1000,
        result.maxMemoryBytes ?? problemMemoryLimit * 1024 * 1024,
        result.errorMessage || null,
        result.passedCount ?? 0,
        result.totalCount ?? 0,
        submissionId,
      ]
    );
  };

  const runAsyncJudge = async (submissionId, code, problem, pythonVersion) => {
    try {
      const testCaseResult = await runQuery(
        `
        SELECT id, input_data, expected_output, is_public, test_order
        FROM test_cases
        WHERE problem_id = $1
        ORDER BY test_order ASC, id ASC
      `,
        [problem.id]
      );

      const testCases = testCaseResult.rows.map((row) => ({
        id: row.id,
        input: row.input_data,
        expectedOutput: row.expected_output,
        isPublic: row.is_public,
      }));

      const judgeResult = await judge({
        code,
        testCases,
        defaultTimeLimitSeconds: problem.time_limit,
        defaultMemoryLimitMB: problem.memory_limit,
        pythonExecutable: pythonVersion,
      });

      await updateSubmissionResult(submissionId, judgeResult, problem.time_limit, problem.memory_limit);
    } catch (error) {
      log.error('채점 비동기 처리 실패', { submissionId, error: error.message });
      await updateSubmissionResult(
        submissionId,
        { status: 'RE', errorMessage: error.message, passedCount: 0, totalCount: 0 },
        problem.time_limit,
        problem.memory_limit
      );
    }
  };

  const parsePagination = ({ limit, offset, page }) => {
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    let offsetNum = parseInt(offset, 10);
    if (Number.isNaN(offsetNum)) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      offsetNum = (pageNum - 1) * limitNum;
    }
    return { limit: limitNum, offset: Math.max(0, offsetNum) };
  };

  const getSubmissions = async (filters, requester) => {
    const { limit, offset } = parsePagination(filters);
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // 권한: 학생은 본인 제출만, 관리자는 선택적으로 studentId 필터 적용
    if (requester.role === 'student') {
      paramCount++;
      conditions.push(`s.student_id = $${paramCount}`);
      params.push(requester.id);
    } else if (filters.studentId) {
      const studentId = parseInt(filters.studentId, 10);
      if (!Number.isNaN(studentId)) {
        paramCount++;
        conditions.push(`s.student_id = $${paramCount}`);
        params.push(studentId);
      }
    }

    if (filters.problemId) {
      const problemId = parseInt(filters.problemId, 10);
      if (!Number.isNaN(problemId)) {
        paramCount++;
        conditions.push(`s.problem_id = $${paramCount}`);
        params.push(problemId);
      }
    }

    if (filters.status) {
      if (!ALLOWED_STATUSES.includes(filters.status)) {
        throw new ValidationError('지원하지 않는 채점 상태입니다.');
      }
      paramCount++;
      conditions.push(`s.status = $${paramCount}`);
      params.push(filters.status);
    }

    if (filters.sessionId) {
      const sessionId = parseInt(filters.sessionId, 10);
      if (!Number.isNaN(sessionId)) {
        paramCount++;
        conditions.push(`s.session_id = $${paramCount}`);
        params.push(sessionId);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      ${whereClause}
    `;
    const countResult = await runQuery(countQuery, params);
    const totalItems = parseInt(countResult.rows[0]?.total || 0, 10);

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const listQuery = `
      SELECT
        s.id,
        s.student_id,
        u.name as student_name,
        s.problem_id,
        p.title as problem_title,
        s.status,
        s.execution_time,
        s.memory_usage,
        s.submitted_at
      FROM submissions s
      JOIN users u ON u.id = s.student_id
      JOIN problems p ON p.id = s.problem_id
      ${whereClause}
      ORDER BY s.submitted_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    const listResult = await runQuery(listQuery, [...params, limit, offset]);

    return {
      submissions: listResult.rows.map((row) => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        problemId: row.problem_id,
        problemTitle: row.problem_title,
        status: row.status,
        executionTime: row.execution_time,
        memoryUsage: row.memory_usage,
        submittedAt: row.submitted_at,
      })),
      pagination: {
        limit,
        offset,
        totalItems,
      },
    };
  };

  const getSubmissionResult = async (submissionId, requester) => {
    const resultQuery = `
      SELECT
        s.id,
        s.student_id,
        u.name as student_name,
        s.problem_id,
        p.title as problem_title,
        s.status,
        s.passed_cases,
        s.total_cases,
        s.execution_time,
        s.memory_usage,
        s.error_message,
        s.submitted_at,
        s.judged_at
      FROM submissions s
      JOIN users u ON u.id = s.student_id
      JOIN problems p ON p.id = s.problem_id
      WHERE s.id = $1
    `;

    const submissionResult = await runQuery(resultQuery, [submissionId]);

    if (submissionResult.rows.length === 0) {
      throw new NotFoundError('제출을 찾을 수 없습니다.');
    }

    const submission = submissionResult.rows[0];

    if (requester.role === 'student' && requester.id !== submission.student_id) {
      throw new ForbiddenError('본인 제출만 조회할 수 있습니다.');
    }

    return {
      id: submission.id,
      studentId: submission.student_id,
      studentName: submission.student_name,
      problemId: submission.problem_id,
      problemTitle: submission.problem_title,
      status: submission.status,
      passedCases: submission.passed_cases ?? 0,
      totalCases: submission.total_cases ?? 0,
      executionTime: submission.execution_time,
      memoryUsage: submission.memory_usage,
      errorMessage: submission.error_message,
      submittedAt: submission.submitted_at,
      judgedAt: submission.judged_at,
    };
  };

  const submitCode = async ({ studentId, userRole, problemId, sessionId, code, pythonVersion }) => {
    if (!studentId) {
      throw new ValidationError('사용자 정보가 필요합니다.');
    }

    const parsedProblemId = parseInt(problemId, 10);
    if (!parsedProblemId) {
      throw new ValidationError('problemId는 숫자여야 합니다.');
    }

    const parsedSessionId = sessionId ? parseInt(sessionId, 10) : null;

    const version = pythonVersion || '3.10';
    if (!SUPPORTED_PYTHON_VERSIONS.includes(version)) {
      throw new ValidationError('지원하지 않는 Python 버전입니다.');
    }

    if (typeof code !== 'string' || code.trim().length === 0) {
      throw new ValidationError('제출할 코드가 비어 있습니다.');
    }

    const codeSize = Buffer.byteLength(code, 'utf8');
    if (codeSize > MAX_CODE_BYTES) {
      throw new AppError('코드 크기가 64KB를 초과했습니다.', 413, 'CODE_SIZE_EXCEEDED');
    }

    const client = await getDbClient();

    try {
      await client.query('BEGIN');

      const problem = await fetchProblem(client, parsedProblemId, userRole);
      await checkDuplicateSubmission(client, studentId, parsedProblemId);

      const astResult = analyzeCode(code, { pythonExecutable: version });
      if (astResult.status !== 'OK') {
        const submissionId = await insertSubmission(client, {
          studentId,
          problemId: parsedProblemId,
          sessionId: parsedSessionId,
          code,
          codeSize,
          status: 'SE',
          pythonVersion: version,
          errorMessage: buildAstErrorMessage(astResult),
        });

        await client.query('COMMIT');

        return {
          submissionId,
          status: 'SE',
          message: buildAstErrorMessage(astResult),
        };
      }

      const submissionId = await insertSubmission(client, {
        studentId,
        problemId: parsedProblemId,
        sessionId: parsedSessionId,
        code,
        codeSize,
        status: 'pending',
        pythonVersion: version,
      });

      await client.query('COMMIT');

      // 비동기 채점 시작 (응답은 즉시 반환)
      setImmediate(() => {
        runAsyncJudge(submissionId, code, problem, version);
      });

      return {
        submissionId,
        status: 'pending',
        message: '제출이 접수되었습니다. 채점을 준비합니다.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  return {
    getSubmissions,
    getSubmissionResult,
    submitCode,
  };
};

export const submissionService = createSubmissionService();

export default submissionService;

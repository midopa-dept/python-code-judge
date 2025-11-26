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
      return `湲덉???紐⑤뱢 ?ъ슜 媛먯?: ${bannedModules}`;
    }
    const bannedFunctions = astResult.errors
      .filter((e) => e.type === 'BANNED_FUNCTION')
      .map((e) => e.target)
      .join(', ');
    if (bannedFunctions) {
      return `湲덉????⑥닔 ?ъ슜 媛먯?: ${bannedFunctions}`;
    }
    return 'AST 寃利앹뿉 ?ㅽ뙣?덉뒿?덈떎.';
  }
  return 'AST 寃利앹뿉 ?ㅽ뙣?덉뒿?덈떎.';
};

/**
 * ?섏〈?깆쓣 二쇱엯 媛?ν븳 ?쒖텧 ?쒕퉬???앹꽦
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
      throw new NotFoundError('臾몄젣瑜?李얠쓣 ???놁뒿?덈떎.');
    }

    const problem = result.rows[0];

    if (userRole === 'student' && problem.visibility !== 'public') {
      throw new ForbiddenError('鍮꾧났媛?臾몄젣???쒖텧?????놁뒿?덈떎.');
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
      throw new AppError('?숈씪 臾몄젣??5珥??대궡???ㅼ떆 ?쒖텧?????놁뒿?덈떎.', 429, 'DUPLICATE_SUBMISSION');
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

  const updateSubmissionResultTx = async (
    executor,
    submissionId,
    result,
    problemTimeLimit,
    problemMemoryLimit
  ) => {
    await executor(
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

  const fetchSubmissionMeta = async (executor, submissionId) => {
    const res = await executor(
      `
      SELECT id, student_id, session_id, problem_id, submitted_at
      FROM submissions
      WHERE id = $1
    `,
      [submissionId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('?쒖텧??李얠쓣 ???놁뒿?덈떎.');
    }

    return res.rows[0];
  };

  const updateScoreboardForAc = async (executor, meta) => {
    const { session_id: sessionId, student_id: studentId, problem_id: problemId, id: submissionId } =
      meta;

    // 세션이 없는 제출은 스코어보드 대상이 아님
    if (!sessionId) return;

    const solvedBefore = await executor(
      `
      SELECT 1
      FROM submissions
      WHERE student_id = $1
        AND problem_id = $2
        AND session_id = $3
        AND status = 'AC'
        AND id <> $4
      LIMIT 1
    `,
      [studentId, problemId, sessionId, submissionId]
    );

    if (solvedBefore.rows.length > 0) {
      return;
    }

    await executor(
      `
      INSERT INTO scoreboards (session_id, student_id, score, solved_count, rank, updated_at)
      VALUES ($1, $2, 1, 1, 1, NOW())
      ON CONFLICT (session_id, student_id)
      DO UPDATE SET
        score = score + 1,
        solved_count = solved_count + 1,
        updated_at = NOW()
    `,
      [sessionId, studentId]
    );

    const ranking = await executor(
      `
      SELECT
        sb.student_id,
        sb.score,
        COALESCE(ac.first_ac_time, NOW()) as first_ac_time
      FROM scoreboards sb
      LEFT JOIN (
        SELECT student_id, MIN(submitted_at) as first_ac_time
        FROM submissions
        WHERE session_id = $1 AND status = 'AC'
        GROUP BY student_id
      ) ac ON ac.student_id = sb.student_id
      WHERE sb.session_id = $1
      ORDER BY sb.score DESC, ac.first_ac_time ASC, sb.student_id ASC
    `,
      [sessionId]
    );

    let rank = 1;
    for (const row of ranking.rows) {
      await executor(
        `
        UPDATE scoreboards
        SET rank = $1, updated_at = NOW()
        WHERE session_id = $2 AND student_id = $3
      `,
        [rank, sessionId, row.student_id]
      );
      rank += 1;
    }
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

      await applyJudgeResult(submissionId, judgeResult, problem);
    } catch (error) {
      log.error('채점 비동기 처리 실패', { submissionId, error: error.message });
      try {
        await updateSubmissionResult(
          submissionId,
          { status: 'RE', errorMessage: error.message, passedCount: 0, totalCount: 0 },
          problem.time_limit,
          problem.memory_limit
        );
      } catch (updateError) {
        log.error('채점 실패 상태 반영 오류', { submissionId, error: updateError.message });
      }
    }
  };

  const applyJudgeResult = async (submissionId, judgeResult, problem) => {
    const client = await getDbClient();
    try {
      await client.query('BEGIN');

      const meta = await fetchSubmissionMeta(client.query.bind(client), submissionId);

      await updateSubmissionResultTx(
        client.query.bind(client),
        submissionId,
        judgeResult,
        problem.time_limit,
        problem.memory_limit
      );

      if (judgeResult.status === 'AC') {
        await updateScoreboardForAc(client.query.bind(client), meta);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundError) {
        log.warn('채점 결과 반영 실패: 제출을 찾을 수 없음(로그만 기록)', {
          submissionId,
          error: error.message,
        });
        return;
      }
      log.error('채점 결과 반영 실패', { submissionId, error: error.message });
      throw error;
    } finally {
      client.release();
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

    // 沅뚰븳: ?숈깮? 蹂몄씤 ?쒖텧留? 愿由ъ옄???좏깮?곸쑝濡?studentId ?꾪꽣 ?곸슜
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
        throw new ValidationError('吏?먰븯吏 ?딅뒗 梨꾩젏 ?곹깭?낅땲??');
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
      throw new NotFoundError('?쒖텧??李얠쓣 ???놁뒿?덈떎.');
    }

    const submission = submissionResult.rows[0];

    if (requester.role === 'student' && requester.id !== submission.student_id) {
      throw new ForbiddenError('蹂몄씤 ?쒖텧留?議고쉶?????덉뒿?덈떎.');
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
      throw new ValidationError('?ъ슜???뺣낫媛 ?꾩슂?⑸땲??');
    }

    const parsedProblemId = parseInt(problemId, 10);
    if (!parsedProblemId) {
      throw new ValidationError('problemId???レ옄?ъ빞 ?⑸땲??');
    }

    const parsedSessionId = sessionId ? parseInt(sessionId, 10) : null;

    const version = pythonVersion || '3.10';
    if (!SUPPORTED_PYTHON_VERSIONS.includes(version)) {
      throw new ValidationError('吏?먰븯吏 ?딅뒗 Python 踰꾩쟾?낅땲??');
    }

    if (typeof code !== 'string' || code.trim().length === 0) {
      throw new ValidationError('?쒖텧??肄붾뱶媛 鍮꾩뼱 ?덉뒿?덈떎.');
    }

    const codeSize = Buffer.byteLength(code, 'utf8');
    if (codeSize > MAX_CODE_BYTES) {
      throw new AppError('肄붾뱶 ?ш린媛 64KB瑜?珥덇낵?덉뒿?덈떎.', 413, 'CODE_SIZE_EXCEEDED');
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

      // 鍮꾨룞湲?梨꾩젏 ?쒖옉 (?묐떟? 利됱떆 諛섑솚)
      setImmediate(() => {
        runAsyncJudge(submissionId, code, problem, version);
      });

      return {
        submissionId,
        status: 'pending',
        message: '?쒖텧???묒닔?섏뿀?듬땲?? 梨꾩젏??以鍮꾪빀?덈떎.',
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
    applyJudgeResult,
  };
};

export const submissionService = createSubmissionService();

export default submissionService;



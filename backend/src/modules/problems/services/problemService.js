import { query } from '../../../config/database.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError.js';

export const problemService = {
  // 문제 목록 조회
  async getProblems(filters, pagination, user) {
    const { page, limit, offset } = pagination;
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // 학생은 public 문제만 볼 수 있음
    if (user.role === 'student') {
      conditions.push(`p.visibility = 'public'`);
    }

    // 카테고리 필터
    if (filters.category) {
      paramCount++;
      conditions.push(`p.category = $${paramCount}`);
      params.push(filters.category);
    }

    // 난이도 필터
    if (filters.difficulty) {
      paramCount++;
      conditions.push(`p.difficulty = $${paramCount}`);
      params.push(parseInt(filters.difficulty, 10));
    }

    // 검색어 (제목, 설명)
    if (filters.search) {
      paramCount++;
      conditions.push(`(p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      params.push(`%${filters.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM problems p
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total, 10);

    // 문제 목록 조회 (사용자의 풀이 여부 포함)
    paramCount++;
    const userIdParam = paramCount;
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const problemsQuery = `
      SELECT
        p.id,
        p.title,
        p.category,
        p.difficulty,
        p.visibility,
        COALESCE(
          ROUND(
            COUNT(CASE WHEN s.status = 'AC' THEN 1 END)::numeric /
            NULLIF(COUNT(s.id), 0)::numeric * 100,
            2
          ),
          0
        ) as accuracy_rate,
        COUNT(DISTINCT s.id) as submission_count,
        EXISTS(
          SELECT 1 FROM submissions
          WHERE problem_id = p.id
            AND student_id = $${userIdParam}
            AND status = 'AC'
        ) as is_solved
      FROM problems p
      LEFT JOIN submissions s ON p.id = s.problem_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const problemsResult = await query(problemsQuery, [...params, user.id, limit, offset]);

    return {
      problems: problemsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        difficulty: row.difficulty,
        visibility: row.visibility,
        accuracyRate: parseFloat(row.accuracy_rate),
        submissionCount: parseInt(row.submission_count, 10),
        isSolved: row.is_solved,
      })),
      totalItems,
    };
  },

  // 문제 상세 조회
  async getProblem(problemId, user) {
    const problemQuery = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.category,
        p.difficulty,
        p.time_limit,
        p.memory_limit,
        p.visibility,
        p.judge_config,
        p.created_at,
        u.name as author_name,
        COALESCE(
          ROUND(
            COUNT(CASE WHEN s.status = 'AC' THEN 1 END)::numeric /
            NULLIF(COUNT(s.id), 0)::numeric * 100,
            2
          ),
          0
        ) as accuracy_rate,
        COUNT(DISTINCT s.id) as submission_count,
        EXISTS(
          SELECT 1 FROM submissions
          WHERE problem_id = p.id
            AND student_id = $2
            AND status = 'AC'
        ) as is_solved
      FROM problems p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN submissions s ON p.id = s.problem_id
      WHERE p.id = $1
      GROUP BY p.id, u.name
    `;

    const problemResult = await query(problemQuery, [problemId, user.id]);

    if (problemResult.rows.length === 0) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    const problem = problemResult.rows[0];

    // 학생은 public 문제만 볼 수 있음
    if (user.role === 'student' && problem.visibility !== 'public') {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    // 테스트 케이스 조회 (학생은 공개 테스트 케이스만)
    let testCasesQuery;
    if (user.role === 'student') {
      testCasesQuery = `
        SELECT id, input_data, expected_output, is_public, test_order
        FROM test_cases
        WHERE problem_id = $1 AND is_public = true
        ORDER BY test_order ASC, id ASC
      `;
    } else {
      testCasesQuery = `
        SELECT id, input_data, expected_output, is_public, test_order
        FROM test_cases
        WHERE problem_id = $1
        ORDER BY test_order ASC, id ASC
      `;
    }

    const testCasesResult = await query(testCasesQuery, [problemId]);

    return {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      category: problem.category,
      difficulty: problem.difficulty,
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit,
      visibility: problem.visibility,
      accuracyRate: parseFloat(problem.accuracy_rate),
      submissionCount: parseInt(problem.submission_count, 10),
      isSolved: problem.is_solved,
      publicTestCases: testCasesResult.rows.map((row) => ({
        id: row.id,
        inputData: row.input_data,
        expectedOutput: row.expected_output,
        isPublic: row.is_public,
      })),
      authorName: problem.author_name,
      createdAt: problem.created_at,
      judgeConfig: problem.judge_config || {},
    };
  },

  // 문제 등록 (관리자 전용)
  async createProblem(problemData, userId) {
    const insertQuery = `
      INSERT INTO problems (
        title,
        description,
        category,
        difficulty,
        time_limit,
        memory_limit,
        visibility,
        judge_config,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const result = await query(insertQuery, [
      problemData.title,
      problemData.description,
      problemData.category,
      problemData.difficulty,
      problemData.timeLimit,
      problemData.memoryLimit || 256,
      problemData.visibility || 'draft',
      JSON.stringify(problemData.judgeConfig || {}),
      userId,
    ]);

    return result.rows[0].id;
  },

  // 문제 수정 (관리자 전용)
  async updateProblem(problemId, updateData) {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (updateData.title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(updateData.description);
    }

    if (updateData.category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(updateData.category);
    }

    if (updateData.difficulty !== undefined) {
      paramCount++;
      updates.push(`difficulty = $${paramCount}`);
      params.push(updateData.difficulty);
    }

    if (updateData.timeLimit !== undefined) {
      paramCount++;
      updates.push(`time_limit = $${paramCount}`);
      params.push(updateData.timeLimit);
    }

    if (updateData.memoryLimit !== undefined) {
      paramCount++;
      updates.push(`memory_limit = $${paramCount}`);
      params.push(updateData.memoryLimit);
    }

    if (updateData.visibility !== undefined) {
      paramCount++;
      updates.push(`visibility = $${paramCount}`);
      params.push(updateData.visibility);
    }

    if (updateData.judgeConfig !== undefined) {
      paramCount++;
      updates.push(`judge_config = $${paramCount}`);
      params.push(JSON.stringify(updateData.judgeConfig));
    }

    if (updates.length === 0) {
      return;
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE problems
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `;

    const result = await query(updateQuery, [...params, problemId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }
  },

  // 문제 삭제 (관리자 전용)
  async deleteProblem(problemId) {
    // 제출 이력 확인
    const submissionCheckQuery = `
      SELECT COUNT(*) as count
      FROM submissions
      WHERE problem_id = $1
    `;
    const submissionResult = await query(submissionCheckQuery, [problemId]);

    if (parseInt(submissionResult.rows[0].count, 10) > 0) {
      throw new ConflictError('제출 이력이 있는 문제는 삭제할 수 없습니다.');
    }

    // 테스트 케이스 먼저 삭제
    await query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    // 문제 삭제
    const deleteQuery = `
      DELETE FROM problems
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(deleteQuery, [problemId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }
  },

  // 테스트 케이스 조회
  async getTestCases(problemId, user) {
    // 문제 존재 여부 확인
    const problemCheck = await query('SELECT id, visibility FROM problems WHERE id = $1', [
      problemId,
    ]);

    if (problemCheck.rows.length === 0) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    // 학생은 공개 테스트 케이스만
    let testCasesQuery;
    if (user.role === 'student') {
      testCasesQuery = `
        SELECT id, input_data, expected_output, is_public, test_order
        FROM test_cases
        WHERE problem_id = $1 AND is_public = true
        ORDER BY test_order ASC, id ASC
      `;
    } else {
      testCasesQuery = `
        SELECT id, input_data, expected_output, is_public, test_order
        FROM test_cases
        WHERE problem_id = $1
        ORDER BY test_order ASC, id ASC
      `;
    }

    const result = await query(testCasesQuery, [problemId]);

    return result.rows.map((row) => ({
      id: row.id,
      inputData: row.input_data,
      expectedOutput: row.expected_output,
      isPublic: row.is_public,
      order: row.test_order,
    }));
  },

  // 테스트 케이스 추가 (관리자 전용)
  async createTestCase(problemId, testCaseData) {
    // 문제 존재 여부 확인
    const problemCheck = await query('SELECT id FROM problems WHERE id = $1', [problemId]);

    if (problemCheck.rows.length === 0) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    const insertQuery = `
      INSERT INTO test_cases (
        problem_id,
        input_data,
        expected_output,
        is_public,
        test_order
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await query(insertQuery, [
      problemId,
      testCaseData.inputData,
      testCaseData.expectedOutput,
      testCaseData.isPublic,
      testCaseData.order || 0,
    ]);

    return result.rows[0].id;
  },

  // 테스트 케이스 수정 (관리자 전용)
  async updateTestCase(problemId, testCaseId, updateData) {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (updateData.inputData !== undefined) {
      paramCount++;
      updates.push(`input_data = $${paramCount}`);
      params.push(updateData.inputData);
    }

    if (updateData.expectedOutput !== undefined) {
      paramCount++;
      updates.push(`expected_output = $${paramCount}`);
      params.push(updateData.expectedOutput);
    }

    if (updateData.isPublic !== undefined) {
      paramCount++;
      updates.push(`is_public = $${paramCount}`);
      params.push(updateData.isPublic);
    }

    if (updateData.order !== undefined) {
      paramCount++;
      updates.push(`test_order = $${paramCount}`);
      params.push(updateData.order);
    }

    if (updates.length === 0) {
      return;
    }

    paramCount++;
    const problemIdParam = paramCount;
    paramCount++;
    const testCaseIdParam = paramCount;

    const updateQuery = `
      UPDATE test_cases
      SET ${updates.join(', ')}
      WHERE problem_id = $${problemIdParam} AND id = $${testCaseIdParam}
      RETURNING id
    `;

    const result = await query(updateQuery, [...params, problemId, testCaseId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('테스트 케이스를 찾을 수 없습니다.');
    }
  },

  // 테스트 케이스 삭제 (관리자 전용)
  async deleteTestCase(problemId, testCaseId) {
    const deleteQuery = `
      DELETE FROM test_cases
      WHERE problem_id = $1 AND id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [problemId, testCaseId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('테스트 케이스를 찾을 수 없습니다.');
    }
  },
};

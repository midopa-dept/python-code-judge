import { query, getClient } from '../../../config/database.js';

/**
 * 세션 목록 조회
 */
export const findAllSessions = async (filters = {}) => {
  const { status, sessionType, creatorId } = filters;

  let sql = `
    SELECT
      es.*,
      u.name as creator_name,
      (SELECT COUNT(*) FROM session_students ss WHERE ss.session_id = es.id) as student_count,
      (SELECT COUNT(*) FROM session_problems sp WHERE sp.session_id = es.id) as problem_count
    FROM education_sessions es
    LEFT JOIN users u ON u.id = es.creator_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (status) {
    sql += ` AND es.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (sessionType) {
    sql += ` AND es.session_type = $${paramIndex}`;
    params.push(sessionType);
    paramIndex++;
  }

  if (creatorId) {
    sql += ` AND es.creator_id = $${paramIndex}`;
    params.push(creatorId);
    paramIndex++;
  }

  sql += ` ORDER BY es.start_time DESC`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * 세션 상세 조회
 */
export const findSessionById = async (sessionId) => {
  const sql = `
    SELECT
      es.*,
      u.name as creator_name,
      (SELECT COUNT(*) FROM session_students ss WHERE ss.session_id = es.id) as student_count,
      (SELECT COUNT(*) FROM session_problems sp WHERE sp.session_id = es.id) as problem_count
    FROM education_sessions es
    LEFT JOIN users u ON u.id = es.creator_id
    WHERE es.id = $1
  `;

  const result = await query(sql, [sessionId]);
  return result.rows[0] || null;
};

/**
 * 세션 생성
 */
export const createSession = async (sessionData) => {
  const { name, startTime, endTime, status, sessionType, allowResubmit, creatorId } = sessionData;

  const sql = `
    INSERT INTO education_sessions (name, start_time, end_time, status, session_type, allow_resubmit, creator_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await query(sql, [name, startTime, endTime, status, sessionType, allowResubmit, creatorId]);
  return result.rows[0];
};

/**
 * 세션 수정
 */
export const updateSession = async (sessionId, sessionData) => {
  const { name, startTime, endTime, status, sessionType, allowResubmit } = sessionData;

  const sql = `
    UPDATE education_sessions
    SET
      name = COALESCE($1, name),
      start_time = COALESCE($2, start_time),
      end_time = COALESCE($3, end_time),
      status = COALESCE($4, status),
      session_type = COALESCE($5, session_type),
      allow_resubmit = COALESCE($6, allow_resubmit)
    WHERE id = $7
    RETURNING *
  `;

  const result = await query(sql, [name, startTime, endTime, status, sessionType, allowResubmit, sessionId]);
  return result.rows[0] || null;
};

/**
 * 세션 삭제
 */
export const deleteSession = async (sessionId) => {
  const sql = `DELETE FROM education_sessions WHERE id = $1 RETURNING *`;
  const result = await query(sql, [sessionId]);
  return result.rows[0] || null;
};

/**
 * 세션 상태 업데이트
 */
export const updateSessionStatus = async (sessionId, newStatus) => {
  // 세션 정보 조회
  const session = await findSessionById(sessionId);
  if (!session) {
    throw new Error('세션을 찾을 수 없습니다');
  }

  const now = new Date();
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);

  // 상태 변경 검증
  if (newStatus === 'active') {
    if (now < startTime) {
      throw new Error('세션 시작 시간 이전에는 세션을 시작할 수 없습니다');
    }
    if (now > endTime) {
      throw new Error('세션 종료 시간이 지나 세션을 시작할 수 없습니다');
    }
  }

  const sql = `
    UPDATE education_sessions
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;

  const result = await query(sql, [newStatus, sessionId]);
  return result.rows[0];
};

/**
 * 세션 초기화 (제출 이력 삭제)
 */
export const resetSession = async (sessionId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 세션의 모든 제출 삭제
    await client.query(
      `DELETE FROM submissions WHERE session_id = $1`,
      [sessionId]
    );

    // 스코어보드 초기화
    await client.query(
      `DELETE FROM scoreboards WHERE session_id = $1`,
      [sessionId]
    );

    await client.query('COMMIT');

    return { success: true, message: '세션이 초기화되었습니다' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 학생 할당
 */
export const assignStudentsToSession = async (sessionId, studentIds) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 세션 존재 여부 확인
    const sessionCheck = await client.query(
      `SELECT id FROM education_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new Error('세션을 찾을 수 없습니다');
    }

    // 학생들 할당
    const results = [];
    for (const studentId of studentIds) {
      const result = await client.query(
        `
        INSERT INTO session_students (session_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (session_id, student_id) DO NOTHING
        RETURNING *
        `,
        [sessionId, studentId]
      );

      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 학생 제거
 */
export const removeStudentFromSession = async (sessionId, studentId) => {
  const sql = `
    DELETE FROM session_students
    WHERE session_id = $1 AND student_id = $2
    RETURNING *
  `;

  const result = await query(sql, [sessionId, studentId]);
  return result.rows[0] || null;
};

/**
 * 세션의 할당된 학생 목록 조회
 */
export const findSessionStudents = async (sessionId) => {
  const sql = `
    SELECT
      s.id, s.military_id, s.login_id, s.name, s.email, s.group_info,
      ss.joined_at
    FROM session_students ss
    JOIN users s ON s.id = ss.student_id
    WHERE ss.session_id = $1
    ORDER BY ss.joined_at ASC
  `;

  const result = await query(sql, [sessionId]);
  return result.rows;
};

/**
 * 문제 할당
 */
export const assignProblemsToSession = async (sessionId, problems) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 세션 존재 여부 확인
    const sessionCheck = await client.query(
      `SELECT id FROM education_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new Error('세션을 찾을 수 없습니다');
    }

    // 문제들 할당
    const results = [];
    for (const problem of problems) {
      const { problemId, order } = problem;

      const result = await client.query(
        `
        INSERT INTO session_problems (session_id, problem_id, problem_order)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id, problem_id) DO UPDATE SET problem_order = $3
        RETURNING *
        `,
        [sessionId, problemId, order]
      );

      results.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 문제 제거
 */
export const removeProblemFromSession = async (sessionId, problemId) => {
  const sql = `
    DELETE FROM session_problems
    WHERE session_id = $1 AND problem_id = $2
    RETURNING *
  `;

  const result = await query(sql, [sessionId, problemId]);
  return result.rows[0] || null;
};

/**
 * 세션의 할당된 문제 목록 조회
 */
export const findSessionProblems = async (sessionId) => {
  const sql = `
    SELECT
      p.id, p.title, p.category, p.difficulty, p.time_limit, p.memory_limit,
      p.visibility,
      sp.problem_order as "order"
    FROM session_problems sp
    JOIN problems p ON p.id = sp.problem_id
    WHERE sp.session_id = $1
    ORDER BY sp.problem_order ASC
  `;

  const result = await query(sql, [sessionId]);
  return result.rows;
};

/**
 * 스코어보드 조회
 */
export const findScoreboard = async (sessionId) => {
  const sql = `
    SELECT
      sb.session_id, sb.student_id, sb.score, sb.solved_count, sb.rank, sb.updated_at,
      s.military_id, s.login_id, s.name, s.group_info
    FROM scoreboards sb
    JOIN users s ON s.id = sb.student_id
    WHERE sb.session_id = $1
    ORDER BY sb.rank ASC, sb.updated_at ASC
  `;

  const result = await query(sql, [sessionId]);
  return result.rows;
};

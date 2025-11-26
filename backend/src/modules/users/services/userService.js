import { query } from '../../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

export const userService = {
  // 학생 목록 조회 (관리자 전용)
  async getStudents(filters, pagination) {
    const { page, limit, offset } = pagination;
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // 학생만 조회
    conditions.push(`role = 'student'`);

    // 그룹 필터
    if (filters.groupInfo) {
      paramCount++;
      conditions.push(`group_info ILIKE $${paramCount}`);
      params.push(`%${filters.groupInfo}%`);
    }

    // 계정 상태 필터
    if (filters.accountStatus) {
      paramCount++;
      conditions.push(`account_status = $${paramCount}`);
      params.push(filters.accountStatus);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total, 10);

    // 학생 목록 조회
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const studentsQuery = `
      SELECT
        id,
        military_id,
        login_id,
        name,
        email,
        group_info,
        account_status,
        created_at,
        last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const studentsResult = await query(studentsQuery, [...params, limit, offset]);

    return {
      students: studentsResult.rows.map((row) => ({
        id: row.id,
        militaryId: row.military_id,
        loginId: row.login_id,
        name: row.name,
        email: row.email,
        groupInfo: row.group_info,
        accountStatus: row.account_status,
        createdAt: row.created_at,
        lastLogin: row.last_login,
      })),
      totalItems,
    };
  },

  // 학생 상세 조회
  async getStudent(studentId, requestingUser) {
    // studentId를 숫자로 변환
    const targetId = parseInt(studentId, 10);

    // 본인 또는 관리자만 조회 가능
    if (
      requestingUser.role === 'student' &&
      requestingUser.id !== targetId
    ) {
      throw new ForbiddenError('본인의 정보만 조회할 수 있습니다.');
    }

    const studentQuery = `
      SELECT
        id,
        military_id,
        login_id,
        name,
        email,
        group_info,
        account_status,
        created_at,
        last_login
      FROM users
      WHERE id = $1 AND role = 'student'
    `;

    const studentResult = await query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0) {
      throw new NotFoundError('학생을 찾을 수 없습니다.');
    }

    const student = studentResult.rows[0];

    // 통계 정보 조회
    const statsQuery = `
      SELECT
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.status = 'AC' THEN s.problem_id END) as solved_problems,
        CASE
          WHEN COUNT(s.id) > 0 THEN
            ROUND(COUNT(CASE WHEN s.status = 'AC' THEN 1 END)::numeric / COUNT(s.id)::numeric * 100, 2)
          ELSE 0
        END as accuracy_rate
      FROM submissions s
      WHERE s.student_id = $1
    `;

    const statsResult = await query(statsQuery, [studentId]);
    const stats = statsResult.rows[0];

    return {
      id: student.id,
      militaryId: student.military_id,
      loginId: student.login_id,
      name: student.name,
      email: student.email,
      groupInfo: student.group_info,
      accountStatus: student.account_status,
      createdAt: student.created_at,
      lastLogin: student.last_login,
      statistics: {
        totalSubmissions: parseInt(stats.total_submissions, 10),
        solvedProblems: parseInt(stats.solved_problems, 10),
        accuracyRate: parseFloat(stats.accuracy_rate),
      },
    };
  },

  // 학생 정보 수정 (관리자 전용)
  async updateStudent(studentId, updateData) {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (updateData.groupInfo !== undefined) {
      paramCount++;
      updates.push(`group_info = $${paramCount}`);
      params.push(updateData.groupInfo);
    }

    if (updateData.accountStatus !== undefined) {
      paramCount++;
      updates.push(`account_status = $${paramCount}`);
      params.push(updateData.accountStatus);
    }

    if (updates.length === 0) {
      return;
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND role = 'student'
      RETURNING id
    `;

    const result = await query(updateQuery, [...params, studentId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('학생을 찾을 수 없습니다.');
    }
  },

  // 학생 삭제 (관리자 전용, soft delete)
  async deleteStudent(studentId) {
    const deleteQuery = `
      UPDATE users
      SET
        account_status = 'deleted',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND role = 'student'
      RETURNING id
    `;

    const result = await query(deleteQuery, [studentId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('학생을 찾을 수 없습니다.');
    }
  },
};

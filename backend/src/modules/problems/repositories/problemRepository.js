import { query } from '../../../config/database.js';

/**
 * Problem Repository
 * 문제 관련 데이터 접근 계층
 */
export const problemRepository = {
  /**
   * 필터링된 문제 목록 조회 (통계 포함)
   * @param {Object} filters - 필터 조건 (category, difficulty, search)
   * @param {Object} pagination - 페이지네이션 정보
   * @param {number} userId - 현재 사용자 ID (풀이 여부 확인용)
   * @returns {Promise<Array>} 문제 목록
   */
  async findAllWithStats(filters, pagination, userId) {
    const { limit, offset } = pagination;
    const { conditions, params } = this._buildWhereClause(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
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
            AND student_id = $${params.length + 1}
            AND status = 'AC'
        ) as is_solved
      FROM problems p
      LEFT JOIN submissions s ON p.id = s.problem_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 2} OFFSET $${params.length + 3}
    `;

    const result = await query(sql, [...params, userId, limit, offset]);
    return result.rows;
  },

  /**
   * 문제 ID로 상세 조회 (통계 포함)
   * @param {number} problemId - 문제 ID
   * @param {number} userId - 현재 사용자 ID
   * @returns {Promise<Object|null>} 문제 상세 정보 또는 null
   */
  async findByIdWithStats(problemId, userId) {
    const sql = `
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

    const result = await query(sql, [problemId, userId]);
    return result.rows[0] || null;
  },

  /**
   * 필터링된 문제 개수 조회
   * @param {Object} filters - 필터 조건
   * @returns {Promise<number>} 문제 개수
   */
  async count(filters) {
    const { conditions, params } = this._buildWhereClause(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT COUNT(*) as total
      FROM problems p
      ${whereClause}
    `;

    const result = await query(sql, params);
    return parseInt(result.rows[0].total, 10);
  },

  /**
   * 문제 생성
   * @param {Object} problemData - 문제 데이터
   * @param {number} userId - 생성자 ID
   * @returns {Promise<number>} 생성된 문제 ID
   */
  async create(problemData, userId) {
    const sql = `
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

    const result = await query(sql, [
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

  /**
   * 문제 수정
   * @param {number} problemId - 문제 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object|null>} 수정된 문제 또는 null
   */
  async update(problemId, updateData) {
    const { setClauses, params } = this._buildUpdateClauses(updateData);

    if (setClauses.length === 0) {
      return null;
    }

    const sql = `
      UPDATE problems
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${params.length + 1}
      RETURNING id
    `;

    const result = await query(sql, [...params, problemId]);
    return result.rows[0] || null;
  },

  /**
   * 문제 삭제
   * @param {number} problemId - 문제 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async delete(problemId) {
    const sql = 'DELETE FROM problems WHERE id = $1 RETURNING id';
    const result = await query(sql, [problemId]);
    return result.rows.length > 0;
  },

  /**
   * 문제의 제출 이력 개수 확인
   * @param {number} problemId - 문제 ID
   * @returns {Promise<number>} 제출 이력 개수
   */
  async countSubmissions(problemId) {
    const sql = 'SELECT COUNT(*) as count FROM submissions WHERE problem_id = $1';
    const result = await query(sql, [problemId]);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * 문제 존재 여부 확인
   * @param {number} problemId - 문제 ID
   * @returns {Promise<Object|null>} 문제 기본 정보 (id, visibility) 또는 null
   */
  async findBasicById(problemId) {
    const sql = 'SELECT id, visibility FROM problems WHERE id = $1';
    const result = await query(sql, [problemId]);
    return result.rows[0] || null;
  },

  /**
   * WHERE 조건절 생성 (내부 헬퍼)
   * @private
   */
  _buildWhereClause(filters) {
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // visibility 필터 (학생용)
    if (filters.visibility) {
      conditions.push(`p.visibility = '${filters.visibility}'`);
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

    return { conditions, params };
  },

  /**
   * UPDATE SET 절 생성 (내부 헬퍼)
   * @private
   */
  _buildUpdateClauses(updateData) {
    const setClauses = [];
    const params = [];
    let paramCount = 0;

    const fieldMap = {
      title: 'title',
      description: 'description',
      category: 'category',
      difficulty: 'difficulty',
      timeLimit: 'time_limit',
      memoryLimit: 'memory_limit',
      visibility: 'visibility',
    };

    Object.entries(fieldMap).forEach(([key, dbColumn]) => {
      if (updateData[key] !== undefined) {
        paramCount++;
        setClauses.push(`${dbColumn} = $${paramCount}`);
        params.push(updateData[key]);
      }
    });

    // judgeConfig는 JSON 직렬화 필요
    if (updateData.judgeConfig !== undefined) {
      paramCount++;
      setClauses.push(`judge_config = $${paramCount}`);
      params.push(JSON.stringify(updateData.judgeConfig));
    }

    return { setClauses, params };
  },
};

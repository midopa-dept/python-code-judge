import { query } from '../../../config/database.js';

/**
 * TestCase Repository
 * 테스트 케이스 관련 데이터 접근 계층
 */
export const testCaseRepository = {
  /**
   * 문제의 테스트 케이스 조회
   * @param {number} problemId - 문제 ID
   * @param {boolean} publicOnly - 공개 테스트 케이스만 조회 여부
   * @returns {Promise<Array>} 테스트 케이스 목록
   */
  async findByProblemId(problemId, publicOnly = false) {
    let sql = `
      SELECT id, input_data, expected_output, is_public, test_order
      FROM test_cases
      WHERE problem_id = $1
    `;

    if (publicOnly) {
      sql += ' AND is_public = true';
    }

    sql += ' ORDER BY test_order ASC, id ASC';

    const result = await query(sql, [problemId]);
    return result.rows;
  },

  /**
   * 테스트 케이스 생성
   * @param {number} problemId - 문제 ID
   * @param {Object} testCaseData - 테스트 케이스 데이터
   * @returns {Promise<number>} 생성된 테스트 케이스 ID
   */
  async create(problemId, testCaseData) {
    const sql = `
      INSERT INTO test_cases (
        problem_id,
        input_data,
        expected_output,
        is_public,
        test_order
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await query(sql, [
      problemId,
      testCaseData.inputData,
      testCaseData.expectedOutput,
      testCaseData.isPublic,
      testCaseData.order || 0,
    ]);

    return result.rows[0].id;
  },

  /**
   * 테스트 케이스 수정
   * @param {number} problemId - 문제 ID
   * @param {number} testCaseId - 테스트 케이스 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object|null>} 수정된 테스트 케이스 또는 null
   */
  async update(problemId, testCaseId, updateData) {
    const setClauses = [];
    const params = [];
    let paramCount = 0;

    if (updateData.inputData !== undefined) {
      paramCount++;
      setClauses.push(`input_data = $${paramCount}`);
      params.push(updateData.inputData);
    }

    if (updateData.expectedOutput !== undefined) {
      paramCount++;
      setClauses.push(`expected_output = $${paramCount}`);
      params.push(updateData.expectedOutput);
    }

    if (updateData.isPublic !== undefined) {
      paramCount++;
      setClauses.push(`is_public = $${paramCount}`);
      params.push(updateData.isPublic);
    }

    if (updateData.order !== undefined) {
      paramCount++;
      setClauses.push(`test_order = $${paramCount}`);
      params.push(updateData.order);
    }

    if (setClauses.length === 0) {
      return null;
    }

    const sql = `
      UPDATE test_cases
      SET ${setClauses.join(', ')}
      WHERE problem_id = $${paramCount + 1} AND id = $${paramCount + 2}
      RETURNING id
    `;

    const result = await query(sql, [...params, problemId, testCaseId]);
    return result.rows[0] || null;
  },

  /**
   * 테스트 케이스 삭제
   * @param {number} problemId - 문제 ID
   * @param {number} testCaseId - 테스트 케이스 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async delete(problemId, testCaseId) {
    const sql = 'DELETE FROM test_cases WHERE problem_id = $1 AND id = $2 RETURNING id';
    const result = await query(sql, [problemId, testCaseId]);
    return result.rows.length > 0;
  },

  /**
   * 문제의 모든 테스트 케이스 삭제
   * @param {number} problemId - 문제 ID
   * @returns {Promise<number>} 삭제된 개수
   */
  async deleteByProblemId(problemId) {
    const sql = 'DELETE FROM test_cases WHERE problem_id = $1';
    const result = await query(sql, [problemId]);
    return result.rowCount;
  },
};

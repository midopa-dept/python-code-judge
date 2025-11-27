/**
 * Problem Model
 * 문제 데이터 모델 및 DTO 변환
 */
export class ProblemModel {
  /**
   * DB Row → 목록용 DTO 변환
   * @param {Object} row - 데이터베이스 행
   * @returns {Object} 목록용 DTO
   */
  static toListDTO(row) {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      difficulty: row.difficulty,
      visibility: row.visibility,
      score: row.score ?? 1,
      accuracyRate: parseFloat(row.accuracy_rate),
      submissionCount: parseInt(row.submission_count, 10),
      isSolved: row.is_solved,
      lastStatus: row.last_status || null,
    };
  }

  /**
   * DB Row → 상세용 DTO 변환
   * @param {Object} row - 데이터베이스 행
   * @param {Array} testCases - 테스트 케이스 목록
   * @returns {Object} 상세용 DTO
   */
  static toDetailDTO(row, testCases = []) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty,
      timeLimit: row.time_limit,
      memoryLimit: row.memory_limit,
      score: row.score ?? 1,
      visibility: row.visibility,
      judgeConfig: row.judge_config || {},
      accuracyRate: parseFloat(row.accuracy_rate),
      submissionCount: parseInt(row.submission_count, 10),
      isSolved: row.is_solved,
      lastStatus: row.last_status || null,
      publicTestCases: testCases,
      authorName: row.author_name,
      createdAt: row.created_at,
    };
  }

  /**
   * Request Body → DB 삽입 데이터 변환
   * @param {Object} data - 요청 바디 데이터
   * @returns {Object} DB 삽입용 데이터
   */
  static toInsertData(data) {
    return {
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit,
      memoryLimit: data.memoryLimit,
      score: data.score,
      visibility: data.visibility,
      judgeConfig: data.judgeConfig,
    };
  }

  /**
   * Request Body → DB 업데이트 데이터 변환
   * @param {Object} data - 요청 바디 데이터
   * @returns {Object} DB 업데이트용 데이터
   */
  static toUpdateData(data) {
    const updateData = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
    if (data.memoryLimit !== undefined) updateData.memoryLimit = data.memoryLimit;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.judgeConfig !== undefined) updateData.judgeConfig = data.judgeConfig;

    return updateData;
  }
}

/**
 * TestCase Model
 * 테스트 케이스 데이터 모델 및 DTO 변환
 */
export class TestCaseModel {
  /**
   * DB Row → DTO 변환
   * @param {Object} row - 데이터베이스 행
   * @returns {Object} DTO
   */
  static toDTO(row) {
    return {
      id: row.id,
      inputData: row.input_data,
      expectedOutput: row.expected_output,
      isPublic: row.is_public,
      order: row.test_order,
    };
  }

  /**
   * Request Body → DB 삽입 데이터 변환
   * @param {Object} data - 요청 바디 데이터
   * @returns {Object} DB 삽입용 데이터
   */
  static toInsertData(data) {
    return {
      inputData: data.inputData,
      expectedOutput: data.expectedOutput,
      isPublic: data.isPublic,
      order: data.order,
    };
  }

  /**
   * Request Body → DB 업데이트 데이터 변환
   * @param {Object} data - 요청 바디 데이터
   * @returns {Object} DB 업데이트용 데이터
   */
  static toUpdateData(data) {
    const updateData = {};

    if (data.inputData !== undefined) updateData.inputData = data.inputData;
    if (data.expectedOutput !== undefined) updateData.expectedOutput = data.expectedOutput;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.order !== undefined) updateData.order = data.order;

    return updateData;
  }
}

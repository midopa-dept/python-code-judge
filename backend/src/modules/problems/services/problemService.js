import { problemRepository } from '../repositories/problemRepository.js';
import { testCaseRepository } from '../repositories/testCaseRepository.js';
import { ProblemModel } from '../models/ProblemModel.js';
import { TestCaseModel } from '../models/TestCaseModel.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError.js';

/**
 * Problem Service
 * 문제 관련 비즈니스 로직 처리
 */
export const problemService = {
  /**
   * 문제 목록 조회
   * @param {Object} filters - 필터 조건
   * @param {Object} pagination - 페이지네이션 정보
   * @param {Object} user - 현재 사용자
   * @returns {Promise<Object>} 문제 목록 및 총 개수
   */
  async getProblems(filters, pagination, user) {
    // 학생은 public 문제만 볼 수 있음
    const searchFilters = { ...filters };
    if (user.role === 'student') {
      searchFilters.visibility = 'public';
    }

    // Repository를 통한 데이터 조회
    const problems = await problemRepository.findAllWithStats(searchFilters, pagination, user.id);
    const totalItems = await problemRepository.count(searchFilters);

    // Model을 통한 DTO 변환
    return {
      problems: problems.map((row) => ProblemModel.toListDTO(row)),
      totalItems,
    };
  },

  /**
   * 문제 상세 조회
   * @param {number} problemId - 문제 ID
   * @param {Object} user - 현재 사용자
   * @returns {Promise<Object>} 문제 상세 정보
   */
  async getProblem(problemId, user) {
    // Repository를 통한 데이터 조회
    const problem = await problemRepository.findByIdWithStats(problemId, user.id);

    if (!problem) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    // 학생은 public 문제만 볼 수 있음
    if (user.role === 'student' && problem.visibility !== 'public') {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    // 테스트 케이스 조회 (학생은 공개 테스트 케이스만)
    const publicOnly = user.role === 'student';
    const testCasesRows = await testCaseRepository.findByProblemId(problemId, publicOnly);
    const testCases = testCasesRows.map((row) => TestCaseModel.toDTO(row));

    // Model을 통한 DTO 변환
    return ProblemModel.toDetailDTO(problem, testCases);
  },

  /**
   * 문제 등록 (관리자 전용)
   * @param {Object} problemData - 문제 데이터
   * @param {number} userId - 생성자 ID
   * @returns {Promise<number>} 생성된 문제 ID
   */
  async createProblem(problemData, userId) {
    // Model을 통한 데이터 변환
    const insertData = ProblemModel.toInsertData(problemData);

    // Repository를 통한 생성
    const problemId = await problemRepository.create(insertData, userId);

    return problemId;
  },

  /**
   * 문제 수정 (관리자 전용)
   * @param {number} problemId - 문제 ID
   * @param {Object} updateData - 수정할 데이터
   */
  async updateProblem(problemId, updateData) {
    // Model을 통한 데이터 변환
    const formattedUpdateData = ProblemModel.toUpdateData(updateData);

    // Repository를 통한 수정
    const result = await problemRepository.update(problemId, formattedUpdateData);

    if (!result) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }
  },

  /**
   * 문제 삭제 (관리자 전용)
   * @param {number} problemId - 문제 ID
   */
  async deleteProblem(problemId) {
    // 제출 이력 확인
    const submissionCount = await problemRepository.countSubmissions(problemId);

    if (submissionCount > 0) {
      throw new ConflictError('제출 이력이 있는 문제는 삭제할 수 없습니다.');
    }

    // 테스트 케이스 먼저 삭제 (CASCADE로 자동 삭제되지만 명시적 처리)
    await testCaseRepository.deleteByProblemId(problemId);

    // 문제 삭제
    const deleted = await problemRepository.delete(problemId);

    if (!deleted) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }
  },

  /**
   * 테스트 케이스 조회
   * @param {number} problemId - 문제 ID
   * @param {Object} user - 현재 사용자
   * @returns {Promise<Array>} 테스트 케이스 목록
   */
  async getTestCases(problemId, user) {
    // 문제 존재 여부 확인
    const problem = await problemRepository.findBasicById(problemId);

    if (!problem) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    // 학생은 공개 테스트 케이스만
    const publicOnly = user.role === 'student';
    const testCasesRows = await testCaseRepository.findByProblemId(problemId, publicOnly);

    // Model을 통한 DTO 변환
    return testCasesRows.map((row) => TestCaseModel.toDTO(row));
  },

  /**
   * 테스트 케이스 추가 (관리자 전용)
   * @param {number} problemId - 문제 ID
   * @param {Object} testCaseData - 테스트 케이스 데이터
   * @returns {Promise<number>} 생성된 테스트 케이스 ID
   */
  async createTestCase(problemId, testCaseData) {
    // 문제 존재 여부 확인
    const problem = await problemRepository.findBasicById(problemId);

    if (!problem) {
      throw new NotFoundError('문제를 찾을 수 없습니다.');
    }

    // Model을 통한 데이터 변환
    const insertData = TestCaseModel.toInsertData(testCaseData);

    // Repository를 통한 생성
    const testCaseId = await testCaseRepository.create(problemId, insertData);

    return testCaseId;
  },

  /**
   * 테스트 케이스 수정 (관리자 전용)
   * @param {number} problemId - 문제 ID
   * @param {number} testCaseId - 테스트 케이스 ID
   * @param {Object} updateData - 수정할 데이터
   */
  async updateTestCase(problemId, testCaseId, updateData) {
    // Model을 통한 데이터 변환
    const formattedUpdateData = TestCaseModel.toUpdateData(updateData);

    // Repository를 통한 수정
    const result = await testCaseRepository.update(problemId, testCaseId, formattedUpdateData);

    if (!result) {
      throw new NotFoundError('테스트 케이스를 찾을 수 없습니다.');
    }
  },

  /**
   * 테스트 케이스 삭제 (관리자 전용)
   * @param {number} problemId - 문제 ID
   * @param {number} testCaseId - 테스트 케이스 ID
   */
  async deleteTestCase(problemId, testCaseId) {
    const deleted = await testCaseRepository.delete(problemId, testCaseId);

    if (!deleted) {
      throw new NotFoundError('테스트 케이스를 찾을 수 없습니다.');
    }
  },
};

import { problemService } from '../services/problemService.js';
import { ValidationError } from '../../../shared/errors/AppError.js';

export const testCaseController = {
  // GET /api/problems/:id/test-cases - 테스트 케이스 조회
  async getTestCases(req, res, next) {
    try {
      const { id } = req.params;
      const testCases = await problemService.getTestCases(id, req.user);

      res.status(200).json({
        success: true,
        data: {
          testCases,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/problems/:id/test-cases - 테스트 케이스 추가 (관리자 전용)
  async createTestCase(req, res, next) {
    try {
      const { id } = req.params;
      const { inputData, expectedOutput, isPublic, order } = req.body;

      // 필수 필드 검증
      if (inputData === undefined || expectedOutput === undefined || isPublic === undefined) {
        throw new ValidationError('필수 필드가 누락되었습니다.');
      }

      const testCaseId = await problemService.createTestCase(id, {
        inputData,
        expectedOutput,
        isPublic,
        order,
      });

      res.status(201).json({
        success: true,
        data: {
          testCaseId,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/problems/:id/test-cases/:testCaseId - 테스트 케이스 수정 (관리자 전용)
  async updateTestCase(req, res, next) {
    try {
      const { id, testCaseId } = req.params;
      const { inputData, expectedOutput, isPublic, order } = req.body;

      await problemService.updateTestCase(id, testCaseId, {
        inputData,
        expectedOutput,
        isPublic,
        order,
      });

      res.status(200).json({
        success: true,
        message: '테스트 케이스가 수정되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/problems/:id/test-cases/:testCaseId - 테스트 케이스 삭제 (관리자 전용)
  async deleteTestCase(req, res, next) {
    try {
      const { id, testCaseId } = req.params;
      await problemService.deleteTestCase(id, testCaseId);

      res.status(200).json({
        success: true,
        message: '테스트 케이스가 삭제되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },
};

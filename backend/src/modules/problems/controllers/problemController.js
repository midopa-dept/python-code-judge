import { problemService } from '../services/problemService.js';
import { getPagination, getPaginationMeta } from '../../../shared/utils/pagination.js';
import { ValidationError } from '../../../shared/errors/AppError.js';
import {
  isValidCategory,
  isValidDifficulty,
  isValidTimeLimit,
  isValidVisibility,
} from '../../../shared/utils/validators.js';

export const problemController = {
  // GET /api/problems - 문제 목록 조회
  async getProblems(req, res, next) {
    try {
      const { category, difficulty, search } = req.query;
      const pagination = getPagination(req.query.page, req.query.limit);

      // 난이도 유효성 검사
      if (difficulty && !isValidDifficulty(difficulty)) {
        throw new ValidationError('유효하지 않은 난이도입니다. (1-5)');
      }

      const filters = {
        category,
        difficulty,
        search,
      };

      const { problems, totalItems } = await problemService.getProblems(
        filters,
        pagination,
        req.user
      );

      console.log('문제 목록 조회 결과:', {
        totalItems,
        problemsCount: problems.length,
        sampleProblem: problems.length > 0 ? { id: problems[0].id, title: problems[0].title } : null
      });

      res.status(200).json({
        success: true,
        data: {
          problems,
          pagination: getPaginationMeta(pagination.page, pagination.limit, totalItems),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/problems/:id - 문제 상세 조회
  async getProblem(req, res, next) {
    try {
      const { id } = req.params;
      const problem = await problemService.getProblem(id, req.user);

      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/problems - 문제 등록 (관리자 전용)
  async createProblem(req, res, next) {
    try {
      const {
        title,
        description,
        category,
        difficulty,
        timeLimit,
        memoryLimit,
        score,
        visibility,
        judgeConfig,
      } = req.body;

      // 필수 필드 검증
      if (!title || !description || !category || !difficulty || !timeLimit) {
        throw new ValidationError('필수 필드가 누락되었습니다.');
      }

      // 카테고리 검증
      if (!isValidCategory(category)) {
        throw new ValidationError('유효하지 않은 카테고리입니다.');
      }

      // 난이도 검증
      if (!isValidDifficulty(difficulty)) {
        throw new ValidationError('유효하지 않은 난이도입니다. (1-5)');
      }

      // 시간 제한 검증
      if (!isValidTimeLimit(timeLimit)) {
        throw new ValidationError('유효하지 않은 시간 제한입니다. (1-10초)');
      }

      // Visibility 검증
      if (visibility && !isValidVisibility(visibility)) {
        throw new ValidationError('유효하지 않은 공개 설정입니다.');
      }

      const problemId = await problemService.createProblem(
        {
          title,
          description,
          category,
          difficulty,
          timeLimit,
          memoryLimit,
          score,
          visibility,
          judgeConfig,
        },
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: {
          problemId,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/problems/:id - 문제 수정 (관리자 전용)
  async updateProblem(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        difficulty,
        timeLimit,
        memoryLimit,
        score,
        visibility,
        judgeConfig,
      } = req.body;

      // 카테고리 검증
      if (category && !isValidCategory(category)) {
        throw new ValidationError('유효하지 않은 카테고리입니다.');
      }

      // 난이도 검증
      if (difficulty && !isValidDifficulty(difficulty)) {
        throw new ValidationError('유효하지 않은 난이도입니다. (1-5)');
      }

      // 시간 제한 검증
      if (timeLimit && !isValidTimeLimit(timeLimit)) {
        throw new ValidationError('유효하지 않은 시간 제한입니다. (1-10초)');
      }

      // Visibility 검증
      if (visibility && !isValidVisibility(visibility)) {
        throw new ValidationError('유효하지 않은 공개 설정입니다.');
      }

      await problemService.updateProblem(id, {
        title,
        description,
        category,
        difficulty,
        timeLimit,
        memoryLimit,
        score,
        visibility,
        judgeConfig,
      });

      res.status(200).json({
        success: true,
        message: '문제가 수정되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/problems/:id - 문제 삭제 (관리자 전용)
  async deleteProblem(req, res, next) {
    try {
      const { id } = req.params;
      await problemService.deleteProblem(id);

      res.status(200).json({
        success: true,
        message: '문제가 삭제되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },
};

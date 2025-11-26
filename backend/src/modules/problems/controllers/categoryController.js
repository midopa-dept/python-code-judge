import { PROBLEM_CATEGORIES } from '../../../shared/utils/validators.js';

export const categoryController = {
  // GET /api/categories - 카테고리 목록 조회
  async getCategories(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: PROBLEM_CATEGORIES,
      });
    } catch (error) {
      next(error);
    }
  },
};

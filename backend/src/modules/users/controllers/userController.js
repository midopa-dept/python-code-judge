import { userService } from '../services/userService.js';
import { getPagination, getPaginationMeta } from '../../../shared/utils/pagination.js';

export const userController = {
  // GET /api/users/students - 학생 목록 조회 (관리자 전용)
  async getStudents(req, res, next) {
    try {
      const { groupInfo, accountStatus } = req.query;
      const pagination = getPagination(req.query.page, req.query.limit);

      const filters = {
        groupInfo,
        accountStatus,
      };

      const { students, totalItems } = await userService.getStudents(
        filters,
        pagination
      );

      res.status(200).json({
        success: true,
        data: {
          students,
          pagination: getPaginationMeta(pagination.page, pagination.limit, totalItems),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/students/:id - 학생 상세 조회
  async getStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await userService.getStudent(id, req.user);

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/users/students/:id - 학생 정보 수정 (관리자 전용)
  async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const { groupInfo, accountStatus } = req.body;

      await userService.updateStudent(id, {
        groupInfo,
        accountStatus,
      });

      res.status(200).json({
        success: true,
        message: '학생 정보가 수정되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/students/:id - 학생 삭제 (관리자 전용)
  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteStudent(id);

      res.status(200).json({
        success: true,
        message: '학생이 삭제되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  },
};

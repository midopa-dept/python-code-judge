import { submissionService } from '../services/submissionService.js';
import { ValidationError } from '../../../shared/errors/AppError.js';

export const extractSubmissionCode = (req) => {
  const { code } = req.body || {};
  const file = req.file;

  if (file) {
    const name = file.originalname?.toLowerCase() || '';
    if (!name.endsWith('.py')) {
      throw new ValidationError('.py 확장자 파일만 업로드할 수 있습니다.');
    }
    return file.buffer.toString('utf8');
  }

  if (typeof code === 'string' && code.trim().length > 0) {
    return code;
  }

  throw new ValidationError('제출할 코드가 필요합니다.');
};

export const submissionController = {
  async createSubmission(req, res, next) {
    try {
      const submissionCode = extractSubmissionCode(req);
      const { problemId, sessionId, pythonVersion } = req.body || {};

      const result = await submissionService.submitCode({
        studentId: req.user.id,
        userRole: req.user.role,
        problemId,
        sessionId,
        pythonVersion,
        code: submissionCode,
      });

      const statusCode = result.status === 'pending' ? 201 : 200;

      res.status(statusCode).json({
        success: true,
        data: {
          submissionId: result.submissionId,
          status: result.status,
          message: result.message,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default submissionController;

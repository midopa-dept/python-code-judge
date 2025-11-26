import * as sessionService from '../services/sessionService.js';

/**
 * POST /api/sessions/:id/students - 학생 할당
 */
export const assignStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'studentIds 배열이 필요합니다',
      });
    }

    const results = await sessionService.assignStudentsToSession(parseInt(id), studentIds);

    res.status(200).json({
      success: true,
      data: results,
      message: `${results.length}명의 학생이 할당되었습니다`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sessions/:id/students/:studentId - 학생 제거
 */
export const removeStudent = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;

    const result = await sessionService.removeStudentFromSession(
      parseInt(id),
      parseInt(studentId)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '해당 세션에 할당된 학생을 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      message: '학생이 제거되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sessions/:id/students - 할당된 학생 목록 조회
 */
export const getSessionStudents = async (req, res, next) => {
  try {
    const { id } = req.params;

    const students = await sessionService.findSessionStudents(parseInt(id));

    res.status(200).json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sessions/:id/problems - 문제 할당
 */
export const assignProblems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { problems } = req.body;

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'problems 배열이 필요합니다 (각 항목: { problemId, order })',
      });
    }

    // 각 문제에 problemId와 order가 있는지 검증
    for (const problem of problems) {
      if (!problem.problemId || problem.order === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: '각 문제는 problemId와 order를 포함해야 합니다',
        });
      }
    }

    const results = await sessionService.assignProblemsToSession(parseInt(id), problems);

    res.status(200).json({
      success: true,
      data: results,
      message: `${results.length}개의 문제가 할당되었습니다`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sessions/:id/problems/:problemId - 문제 제거
 */
export const removeProblem = async (req, res, next) => {
  try {
    const { id, problemId } = req.params;

    const result = await sessionService.removeProblemFromSession(
      parseInt(id),
      parseInt(problemId)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '해당 세션에 할당된 문제를 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      message: '문제가 제거되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sessions/:id/problems - 할당된 문제 목록 조회
 */
export const getSessionProblems = async (req, res, next) => {
  try {
    const { id } = req.params;

    const problems = await sessionService.findSessionProblems(parseInt(id));

    res.status(200).json({
      success: true,
      data: problems,
      count: problems.length,
    });
  } catch (error) {
    next(error);
  }
};

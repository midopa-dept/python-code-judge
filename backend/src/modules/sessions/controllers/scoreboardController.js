import * as sessionService from '../services/sessionService.js';

/**
 * GET /api/sessions/:id/scoreboard - 스코어보드 조회
 */
export const getScoreboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 세션 존재 여부 확인
    const session = await sessionService.findSessionById(parseInt(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '세션을 찾을 수 없습니다',
      });
    }

    const scoreboard = await sessionService.findScoreboard(parseInt(id));

    const mapped = scoreboard.map((row) => ({
      sessionId: row.session_id,
      studentId: row.student_id,
      studentName: row.student_name || row.name || row.login_id,
      score: parseInt(row.score, 10) || 0,
      solvedCount: parseInt(row.solved_count, 10) || 0,
      rank: parseInt(row.rank, 10) || null,
      updatedAt: row.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          startTime: session.start_time,
          endTime: session.end_time,
        },
        scoreboard: mapped,
      },
      count: mapped.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sessions/my/scoreboard - 현재 학생 세션 스코어보드 조회
 */
export const getMyScoreboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const session = await sessionService.findStudentCurrentSession(studentId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '참여 중인 세션이 없습니다',
      });
    }

    const scoreboard = await sessionService.findScoreboard(session.id);

    const mapped = scoreboard.map((row) => ({
      sessionId: row.session_id,
      studentId: row.student_id,
      studentName: row.student_name || row.name || row.login_id,
      score: parseInt(row.score, 10) || 0,
      solvedCount: parseInt(row.solved_count, 10) || 0,
      rank: parseInt(row.rank, 10) || null,
      updatedAt: row.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          startTime: session.start_time,
          endTime: session.end_time,
        },
        scoreboard: mapped,
      },
      count: mapped.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sessions/:id/scoreboard - 스코어보드 수동 갱신
 *
 * 참고: 스코어보드는 트리거로 자동 업데이트되므로
 * 이 엔드포인트는 필요 시 강제 갱신 용도로만 사용됩니다.
 */
export const updateScoreboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 세션 존재 여부 확인
    const session = await sessionService.findSessionById(parseInt(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '세션을 찾을 수 없습니다',
      });
    }

    // 스코어보드는 트리거로 자동 업데이트되므로 조회만 수행
    const scoreboard = await sessionService.findScoreboard(parseInt(id));

    res.status(200).json({
      success: true,
      data: scoreboard,
      message: '스코어보드가 조회되었습니다 (트리거로 자동 업데이트됨)',
    });
  } catch (error) {
    next(error);
  }
};

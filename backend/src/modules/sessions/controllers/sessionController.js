import * as sessionService from '../services/sessionService.js';

/**
 * GET /api/sessions - 세션 목록 조회
 */
export const getSessions = async (req, res, next) => {
  try {
    const { status, sessionType, creatorId } = req.query;

    const sessions = await sessionService.findAllSessions({
      status,
      sessionType,
      creatorId: creatorId ? parseInt(creatorId) : undefined,
    });

    res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sessions/:id - 세션 상세 조회
 */
export const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await sessionService.findSessionById(parseInt(id));

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '세션을 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sessions - 세션 생성 (관리자 전용)
 */
export const createSession = async (req, res, next) => {
  try {
    const { name, startTime, endTime, status, sessionType, allowResubmit } = req.body;

    // 필수 필드 검증
    if (!name || !startTime || !endTime || !sessionType) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다 (name, startTime, endTime, sessionType)',
      });
    }

    // 시간 검증
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '종료 시간은 시작 시간보다 이후여야 합니다',
      });
    }

    const sessionData = {
      name,
      startTime,
      endTime,
      status: status || 'scheduled',
      sessionType,
      allowResubmit: allowResubmit !== undefined ? allowResubmit : true,
      creatorId: req.user.id, // 인증 미들웨어에서 설정
    };

    const session = await sessionService.createSession(sessionData);

    res.status(201).json({
      success: true,
      data: session,
      message: '세션이 생성되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sessions/:id - 세션 수정 (관리자 전용)
 */
export const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, status, sessionType, allowResubmit } = req.body;

    // 세션 존재 여부 확인
    const existingSession = await sessionService.findSessionById(parseInt(id));
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '세션을 찾을 수 없습니다',
      });
    }

    // 시간 검증
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: '종료 시간은 시작 시간보다 이후여야 합니다',
        });
      }
    }

    const sessionData = {
      name,
      startTime,
      endTime,
      status,
      sessionType,
      allowResubmit,
    };

    const session = await sessionService.updateSession(parseInt(id), sessionData);

    res.status(200).json({
      success: true,
      data: session,
      message: '세션이 수정되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sessions/:id - 세션 삭제 (관리자 전용)
 */
export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await sessionService.deleteSession(parseInt(id));

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '세션을 찾을 수 없습니다',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
      message: '세션이 삭제되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sessions/:id/status - 세션 상태 변경
 */
export const updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'status 필드가 필요합니다',
      });
    }

    const validStatuses = ['scheduled', 'active', 'ended', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}`,
      });
    }

    const session = await sessionService.updateSessionStatus(parseInt(id), status);

    res.status(200).json({
      success: true,
      data: session,
      message: '세션 상태가 변경되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sessions/:id/reset - 세션 초기화
 */
export const resetSession = async (req, res, next) => {
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

    const result = await sessionService.resetSession(parseInt(id));

    res.status(200).json({
      success: true,
      data: result,
      message: '세션이 초기화되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

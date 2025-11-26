import * as auditService from '../services/auditService.js';

/**
 * 감사 로그 기록 미들웨어
 * @param {string} actionType - 액션 타입 (login, create, update, delete, submit, access_denied)
 */
export const logAction = (actionType) => {
  return async (req, res, next) => {
    // 원래 응답 전송 함수들을 래핑하여 결과를 기록
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let logged = false;

    // res.json을 오버라이드
    res.json = async function (body) {
      if (!logged) {
        await logAudit(req, res, actionType, body);
        logged = true;
      }
      return originalJson(body);
    };

    // res.send를 오버라이드
    res.send = async function (body) {
      if (!logged) {
        await logAudit(req, res, actionType, body);
        logged = true;
      }
      return originalSend(body);
    };

    next();
  };
};

/**
 * 감사 로그 기록 헬퍼 함수
 */
async function logAudit(req, res, actionType, responseBody) {
  try {
    // 사용자 정보 추출 (인증 미들웨어를 거친 경우)
    const userId = req.user?.id || 0;
    const userRole = req.user?.role || 'unknown';

    // IP 주소 추출
    const ipAddress = req.ip || req.connection?.remoteAddress || null;

    // User-Agent 추출
    const userAgent = req.headers['user-agent'] || null;

    // 대상 리소스 추출 (요청 경로)
    const targetResource = `${req.method} ${req.originalUrl || req.url}`;

    // 결과 판단 (응답 상태 코드 기반)
    const result = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure';

    // 에러 메시지 추출 (실패한 경우)
    let errorMessage = null;
    if (result === 'failure' && responseBody) {
      if (typeof responseBody === 'object') {
        errorMessage = responseBody.message || responseBody.error || null;
      } else if (typeof responseBody === 'string') {
        errorMessage = responseBody;
      }
    }

    // 감사 로그 생성
    await auditService.createAuditLog({
      userId,
      userRole,
      actionType,
      targetResource,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  } catch (error) {
    // 감사 로그 기록 실패는 무시 (비즈니스 로직에 영향 없음)
    console.error('감사 로그 기록 실패:', error);
  }
}

/**
 * 직접 감사 로그 기록 함수 (미들웨어 외부에서 사용)
 */
export const createAuditLog = async (req, actionType, result = 'success', errorMessage = null) => {
  try {
    const userId = req.user?.id || 0;
    const userRole = req.user?.role || 'unknown';
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const targetResource = `${req.method} ${req.originalUrl || req.url}`;

    await auditService.createAuditLog({
      userId,
      userRole,
      actionType,
      targetResource,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  } catch (error) {
    console.error('감사 로그 기록 실패:', error);
  }
};

import * as auditService from '../services/auditService.js';

/**
 * GET /api/audit-logs - 감사 로그 조회 (최고관리자 전용)
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { userId, actionType, startDate, endDate, limit, offset, page, pageSize } = req.query;

    // 페이지네이션 처리
    let finalLimit = 100; // 기본값
    let finalOffset = 0;

    if (limit) {
      finalLimit = Math.min(parseInt(limit), 1000); // 최대 1000개
    }

    if (pageSize) {
      finalLimit = Math.min(parseInt(pageSize), 1000);
    }

    if (offset) {
      finalOffset = parseInt(offset);
    } else if (page && pageSize) {
      const pageNum = parseInt(page);
      const size = parseInt(pageSize);
      finalOffset = (pageNum - 1) * size;
    }

    const filters = {
      userId: userId ? parseInt(userId) : undefined,
      actionType,
      startDate,
      endDate,
      limit: finalLimit,
      offset: finalOffset,
    };

    // 데이터 조회
    const logs = await auditService.findAuditLogs(filters);

    // 총 개수 조회 (페이지네이션 정보용)
    const totalCount = await auditService.countAuditLogs({
      userId: filters.userId,
      actionType: filters.actionType,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalCount,
        limit: finalLimit,
        offset: finalOffset,
        page: page ? parseInt(page) : Math.floor(finalOffset / finalLimit) + 1,
        totalPages: Math.ceil(totalCount / finalLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

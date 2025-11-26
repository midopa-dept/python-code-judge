import { query } from '../../../config/database.js';

/**
 * 감사 로그 생성
 */
export const createAuditLog = async (logData) => {
  const {
    userId,
    userRole,
    actionType,
    targetResource,
    ipAddress,
    userAgent,
    result,
    errorMessage,
  } = logData;

  const sql = `
    INSERT INTO audit_logs (
      user_id, user_role, action_type, target_resource,
      ip_address, user_agent, result, error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const params = [
    userId,
    userRole,
    actionType,
    targetResource || null,
    ipAddress || null,
    userAgent || null,
    result,
    errorMessage || null,
  ];

  const resultData = await query(sql, params);
  return resultData.rows[0];
};

/**
 * 감사 로그 조회
 */
export const findAuditLogs = async (filters = {}) => {
  const { userId, actionType, startDate, endDate, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT
      al.*,
      u.name as user_name,
      u.login_id as user_login_id
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (userId) {
    sql += ` AND al.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  if (actionType) {
    sql += ` AND al.action_type = $${paramIndex}`;
    params.push(actionType);
    paramIndex++;
  }

  if (startDate) {
    sql += ` AND al.performed_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND al.performed_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  sql += ` ORDER BY al.performed_at DESC`;

  // LIMIT과 OFFSET 추가
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * 감사 로그 총 개수 조회
 */
export const countAuditLogs = async (filters = {}) => {
  const { userId, actionType, startDate, endDate } = filters;

  let sql = `SELECT COUNT(*) as total FROM audit_logs WHERE 1=1`;

  const params = [];
  let paramIndex = 1;

  if (userId) {
    sql += ` AND user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  if (actionType) {
    sql += ` AND action_type = $${paramIndex}`;
    params.push(actionType);
    paramIndex++;
  }

  if (startDate) {
    sql += ` AND performed_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND performed_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].total);
};

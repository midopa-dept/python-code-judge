/**
 * 애플리케이션 전역 에러 클래스
 * HTTP 상태 코드와 함께 에러를 처리합니다.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message = '요청한 리소스를 찾을 수 없습니다.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '이 작업을 수행할 권한이 없습니다.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = '요청한 작업이 충돌합니다.') {
    super(message, 409, 'CONFLICT');
  }
}

export default AppError;

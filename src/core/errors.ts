export class CarlyError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'CarlyError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends CarlyError {
  constructor(message = 'Authentication failed. Run: carly login') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends CarlyError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CarlyError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends CarlyError {
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends CarlyError {
  constructor(message = 'Carly API server error', statusCode = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

export function formatError(error: unknown): string {
  if (error instanceof CarlyError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return '[NETWORK_ERROR] Could not connect to the Carly API. Check your internet connection.';
    }
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return '[TIMEOUT] Request timed out. Try again.';
    }
    return error.message;
  }
  return String(error);
}

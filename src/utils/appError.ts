class AppError extends Error {
  code?: number;
  errorCode?: number;
  statusCode: number;

  status: string;

  isOperational: true;

  constructor(message: string, statusCode?: number, errorCode?: number) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
export default AppError;

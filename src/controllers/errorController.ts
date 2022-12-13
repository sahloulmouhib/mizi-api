import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from 'express';

import AppError from '../utils/appError';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import { DUPLICATE_FIELD } from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';

const { errorMessages } = strings;
const handleCastErrorDB = (err: any) => {
  const message = errorMessages.global.invalid_id;
  // const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};

const handleJWTError = () =>
  new AppError(errorMessages.token.invalid, HttpStatusCode.UNAUTHORIZED);

const handleJWTExpired = () =>
  new AppError(errorMessages.token.expired, HttpStatusCode.UNAUTHORIZED);

const sendErrorProd = (err: any, res: Response) => {
  //Operational, trusted error; send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
    });
  } else {
    //Programming or other unknown erro : don't leak error details
    //console.error('Error', err);

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: errorMessages.global.internal,
    });
  }
};

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    statusCode: err.statusCode,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const handleValidationDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, HttpStatusCode.BAD_REQUEST);
};

const globalError: ErrorRequestHandler = (err: AppError, req, res, next) => {
  err.statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error: AppError = Object.create(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === DUPLICATE_FIELD) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpired();

    sendErrorProd(error, res);
  }
  // });
};

export default globalError;

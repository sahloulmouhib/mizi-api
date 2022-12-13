// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch((err) => next(err));
//   };
// };
import { Request, Response, NextFunction, RequestHandler } from 'express';
//import AppError from './appError';

const catchAsync =
  // eslint-disable-next-line @typescript-eslint/ban-types
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: any) => next(err));
  };

export default catchAsync;

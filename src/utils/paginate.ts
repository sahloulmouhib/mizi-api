import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
const paginate = (req: Request, documentsLength: number) => {
  let next = null;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || documentsLength;
  const skip = (page - 1) * limit;

  if (documentsLength > page * limit) {
    console.log((page + 1) * limit, documentsLength);
    next = documentsLength - page * limit;
  } else {
    next = null;
  }
  return next;
};
export default paginate;

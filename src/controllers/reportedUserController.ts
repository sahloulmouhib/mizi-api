import { NextFunction, Request, Response } from 'express';
import * as factory from './handlerController';
import ReportedUser from '../models/reportedUserModel';
import catchAsync from '../utils/catchAsync';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import AppError from '../utils/appError';
import strings from '../utils/constants/strings.json';

const { errorMessages } = strings;
//export const getAllUserReportedUser = factory.getAllwithAuth(ReportedUser);
export const getAllReportedUsers = factory.getAll(ReportedUser);
export const createReportedUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    req.body.reporter = req.user!._id;
    req.body.reportedUser = req.params.id;
    if (req.user!._id.toString() === req.params.id) {
      return next(
        new AppError(
          errorMessages.reported_users.self,
          HttpStatusCode.BAD_REQUEST
        )
      );
    }
    const reportedUser = await ReportedUser.create(req.body);

    res.status(HttpStatusCode.CREATED).json({
      status: 'success',
      data: { reportedUser },
    });
  }
);
export const getReportedUser = factory.getOne(ReportedUser);
//export const updateReportedUser = factory.updateOne(ReportedUser);
//export const deleteReportedUser = factory.deleteOne(ReportedUser);

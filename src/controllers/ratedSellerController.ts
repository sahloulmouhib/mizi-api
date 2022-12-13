import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import * as factory from './handlerController';

import RatedSeller from '../models/ratedSellerModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import strings from '../utils/constants/strings.json';

const { errorMessages } = strings;

export const getAllUserRatedSellers = factory.getAllwithAuth(RatedSeller);
export const getAllRatedSellers = factory.getAll(RatedSeller);
// export const rateSellerTemp = factory.createOneWithAuth(RatedSeller);
export const rateSeller = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let statusCode = HttpStatusCode.CREATED;
    let doc: any;
    if (req.user) {
      if (req.user._id.toString() === req.params.id) {
        return next(
          new AppError(
            errorMessages.rated_sellers.self,
            HttpStatusCode.BAD_REQUEST
          )
        );
      } else {
        doc = await RatedSeller.findOne({
          seller: req.params.id,
          user: req.user._id,
        });
        // console.log('ssssssssssssssssssssssssssssssssss', doc);
        if (doc) {
          statusCode = HttpStatusCode.OK;
          doc = await RatedSeller.findOneAndUpdate(
            {
              seller: req.params.id,
              user: req.user._id,
            },
            { rating: req.body.rating },
            { runValidators: true }
          );
        } else {
          doc = await RatedSeller.create({
            rating: req.body.rating,
            seller: req.params.id,
            user: req.user._id,
          });
        }
      }
    } else {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }

    res.status(statusCode).json({
      status: 'success',
      data: { bid: doc },
    });
  }
);

export const getRatedSeller = factory.getOne(RatedSeller);
export const updateRatedSeller = factory.updateOne(RatedSeller);
export const deleteRatedSeller = factory.deleteOne(RatedSeller);

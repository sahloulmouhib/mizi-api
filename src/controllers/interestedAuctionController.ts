import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import * as factory from './handlerController';
import catchAsync from '../utils/catchAsync';
import Auction from '../models/auctionModel';
import InterestedAuction from '../models/interestedAuctionModel';
import AppError from '../utils/appError';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import strings from '../utils/constants/strings.json';

const { errorMessages } = strings;

export const getAllInterestedAuctions = factory.getAll(InterestedAuction);

export const getAllUserInterestedAuctions =
  factory.getAllwithAuth(InterestedAuction);

export const createInterestedAuction =
  factory.createOneWithAuth(InterestedAuction);

export const getInterestedAuction = factory.getOne(InterestedAuction, {
  path: 'user auction',
});
export const updateInterestedAuction = factory.updateOne(InterestedAuction);
export const deleteInterestedAuction = factory.deleteOne(InterestedAuction);

// export const getUserInterestedAuctions = catchAsync(
//   async (req: Request, res: Response) => {

//     //Build The Query
//     const query = InterestedAuction.find({ user: req.user!._id });
//     const participatedAuctions = await query;

//     //Send Response
//     res.status(HttpStatusCode.ACCEPTED).json({
//       status: 'success',
//       results: participatedAuctions.length,
//       data: { InterestedAuctions: participatedAuctions },
//     });
//   }
// );

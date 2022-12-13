import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import * as factory from './handlerController';
import catchAsync from '../utils/catchAsync';
import Auction from '../models/auctionModel';
import Bid from '../models/bidModel';
import AppError from '../utils/appError';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import strings from '../utils/constants/strings.json';

const { errorMessages } = strings;

export const getAllBids = factory.getAll(Bid);
export const getAllUserBids = factory.getAllwithAuth(Bid);
export const createBidTemp = factory.createOne(Bid);
export const createBid = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let doc: any;
    if (req.user) {
      const auction = await Auction.findById({ _id: req.body.auction });

      if (req.user._id.toString() === auction?.user.toString()) {
        return next(
          new AppError(errorMessages.bid.owner, HttpStatusCode.BAD_REQUEST)
        );
      }
      doc = await Bid.create({ ...req.body, user: req.user._id });
    } else {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }

    res.status(HttpStatusCode.CREATED).json({
      status: 'success',
      data: { bid: doc },
    });
  }
);
export const getBid = factory.getOne(Bid, { path: 'user auction' });
export const updateBid = factory.updateOne(Bid);
export const deleteBid = factory.deleteOne(Bid);

export const getUserBids = catchAsync(async (req: Request, res: Response) => {
  //To allow for nested Get bids on auction (hack)

  //Build The Query
  const query = Bid.find({ user: req.user!._id });
  const participatedAuctions = await query;

  //Send Response
  res.status(HttpStatusCode.ACCEPTED).json({
    status: 'success',
    results: participatedAuctions.length,
    data: { bids: participatedAuctions },
  });
});

// export const getParticipatedAuctions = catchAsync(
//   async (req: Request, res: Response) => {
//     //To allow for nested Get bids on auction (hack)

//     //Build The Query
//     const query = Bid.aggregate([
//       {
//         $match: { user: req.user!._id },
//       },
//       {
//         $group: {
//           _id: '$auction',
//           numberOfbids: { $sum: 1 },
//           maxBid: { $max: '$price' },
//         },
//       },
//       {
//         // add an extra field called month
//         $addFields: { auction: '$_id' },
//       },
//       {
//         $project: { _id: 0 },
//       },
//     ]);
//     // const participatedAuctionsIds: string[] = [];

//     const participatedAuctionsIds = await query;
//     const participatedAuctions = await Auction.populate(
//       participatedAuctionsIds,
//       {
//         path: 'auction',
//         select: { title: 1, active: 1 },
//       }
//     );
//     // for (let i = 0; i < participatedAuctions.length; i += 1) {
//     //   participatedAuctionsIds.push(participatedAuctions[i]._id);
//     // }

//     // const participatedAuctions2 = await Auction.find({
//     //   _id: { $in: participatedAuctionsIds },
//     // })
//     //   .lean()
//     //   .select('title');

//     // const participatedAuctionsFinal: any[] = [];
//     // for (let i = 0; i < participatedAuctions.length; i += 1) {
//     //   for (let j = 0; j < participatedAuctions2.length; j += 1) {
//     //     if (participatedAuctions[i]._id.equals(participatedAuctions2[j]._id)) {
//     //       participatedAuctionsFinal.push({
//     //         ...participatedAuctions2[j],
//     //         userMaxBid: participatedAuctions[i].maxBid,
//     //         numberOfBids: participatedAuctions[i].numberOfbids,
//     //       });
//     //       break;
//     //     }
//     //   }
//     // }

//     //Send Response
//     res.status(201).json({
//       status: 'success',
//       results: participatedAuctions.length,
//       data: { data: participatedAuctions },
//     });
//   }
// );

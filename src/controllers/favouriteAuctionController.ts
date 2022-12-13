import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import * as factory from './handlerController';
import catchAsync from '../utils/catchAsync';
//import AppError from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';

import FavouriteAuction from '../models/favoriteAuctionsModel';
import AppError from '../utils/appError';
import strings from '../utils/constants/strings.json';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import paginate from '../utils/paginate';
import Auction from '../models/auctionModel';
import User from '../models/userModel';

export const getAllUserFavouriteAuctions = factory.getAllwithAuth(
  FavouriteAuction,
  {
    path: 'auction',
    populate: {
      path: 'user',
    },
  }
);

// export const getUserFavouriteAuctions2 = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const active = req.query.active || true;
//     const model = FavouriteAuction;
//     const popOptions = {
//       path: 'auction',
//       match: {},
//       // populate: {
//       //   path: 'user',
//       // },
//     };

//     if (!req.user) {
//       return next(
//         new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
//       );
//     }
//     //Build The Query

//     let query = model.find({ user: req.user._id });

//     if (popOptions) query = query.populate(popOptions);

//     const documentsLength = await query.clone().countDocuments();
//     const nextPage = paginate(req, documentsLength);

//     const features = new APIFeatures(query, req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//     //Execute Query
//     const doc = await features.query;

//     const data = {};
//     const dataName = `${
//       model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)
//     }s`;
//     //@ts-ignore
//     data[dataName] = doc;

//     //Send Response
//     res.status(HttpStatusCode.ACCEPTED).json({
//       next: nextPage,
//       status: 'success',
//       results: doc.length,
//       data,
//     });
//   }
// );

//FIXME:  aggregate in this case won't return default values
export const getUserFavouriteAuctions2 = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let activeString = req.query?.active?.toString().trim().toLowerCase();
    let active: boolean | undefined;
    if (activeString === 'true') {
      active = true;
    } else if (activeString === 'false') {
      active = false;
    } else {
      active = undefined;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    //Build The Query
    const query = FavouriteAuction.aggregate([
      {
        $match: { user: req.user!._id },
      },

      { $sort: { date: -1, _id: 1 } },

      {
        $lookup: {
          from: Auction.collection.name,
          localField: 'auction',
          foreignField: '_id',
          as: 'auction',
        },
      },
      // {
      //   $project: {
      //     item: 1,
      //     'auction.categoryID': {
      //       $ifNull: ['$auction.categoryID', 'Unspecified'],
      //     },
      //   },
      // },
      { $unwind: '$auction' },

      {
        $lookup: {
          from: User.collection.name,
          localField: 'auction.user',
          foreignField: '_id',
          as: 'auction.user',
        },
      },
      { $unwind: '$auction.user' },
    ]);
    if (active !== undefined) {
      query.append({ $match: { 'auction.active': active } });
    }

    const documentsLength = (await query).length;

    const favoriteAuctions = await query.append(
      { $skip: skip },
      { $limit: limit }
    );
    let nextPage = null;
    if (documentsLength > page * limit) {
      console.log((page + 1) * limit, documentsLength);
      nextPage = documentsLength - page * limit;
    } else {
      nextPage = null;
    }

    //Send Response
    res.status(HttpStatusCode.ACCEPTED).json({
      next: nextPage,
      status: 'success',
      results: favoriteAuctions.length,
      data: {
        favouriteAuctions: favoriteAuctions,
      },
    });
  }
);
export const getAllFavouriteAuctions = factory.getAll(FavouriteAuction);
// export const createFavouriteAuction =
//   factory.createOneWithAuth(FavouriteAuction);
export const getFavouriteAuction = factory.getOne(FavouriteAuction);
export const updateFavouriteAuction = factory.updateOne(FavouriteAuction);
export const deleteFavouriteAuction = factory.deleteOne(FavouriteAuction);

const { errorMessages } = strings;
export const createFavouriteAuction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let doc: any;
    if (req.user) {
      doc = await FavouriteAuction.create({
        auction: req.params.id,
        user: req.user._id,
      });
    } else {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }

    res.status(HttpStatusCode.CREATED).json({
      status: 'success',
      data: { facouriteAuctions: doc },
    });
  }
);

import { Model } from 'mongoose';
import { NextFunction, Request, Response } from 'express';

import catchAsync from '../utils/catchAsync';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import strings from '../utils/constants/strings.json';
import paginate from '../utils/paginate';
import InterestedAuction from '../models/interestedAuctionModel';
import mongoose from 'mongoose';
import Auction, { IAuction } from '../models/auctionModel';
import {
  AI_API_BASE_URL,
  INTERESTED_AUCTION_TYPE,
} from '../utils/constants/constants';
import User from '../models/userModel';

// eslint-disable-next-line no-new-func
const importDynamic = new Function('modulePath', 'return import(modulePath)');
const fetch = async (...args: any[]) => {
  const module = await importDynamic('node-fetch');
  return module.default(...args);
};

const { errorMessages } = strings;

export const deleteOne = (model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const dataName =
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1);
    //postman in this case does not display anything
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(
          `No ${dataName} found with that ID`,
          HttpStatusCode.NOT_FOUND
        )
      );
    }

    res.status(HttpStatusCode.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = {};
    const dataName =
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1);
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(
          `No ${dataName} found with that ID`,
          HttpStatusCode.NOT_FOUND
        )
      );
    }

    //@ts-ignore
    data[dataName] = doc;

    res.status(HttpStatusCode.ACCEPTED).json({
      status: 'success',
      data,
    });
  });

export const createOne = (model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const newDoc = await model.create(req.body);

    const data = {};
    const dataName =
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1);
    //@ts-ignore
    data[dataName] = newDoc;

    res.status(HttpStatusCode.CREATED).json({
      status: 'success',
      data,
    });
  });

export const getOne = (model: Model<any>, popOptions?: object) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = {};
    const dataName =
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1);

    let query = model.findById({ _id: req.params.id });
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(
          `No ${dataName} found with that ID`,
          HttpStatusCode.NOT_FOUND
        )
      );
    }

    //@ts-ignore
    data[dataName] = doc;

    res.status(HttpStatusCode.ACCEPTED).json({
      status: 'success',
      data,
    });
  });

export const getAll = (model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //To allow for nested Get bids on auction (hack)
    let filter = {};

    if (req.params.auctionId) {
      filter = { auction: req.params.auctionId };
    }
    if (req.user) {
      filter = { user: req.user._id };
    }
    if (req.params.auctionId && req.user) {
      filter = { auction: req.params.auctionId, user: req.user._id };
    }

    //Build The Query
    const features = new APIFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //Execute Query
    const doc = await features.query;

    const data = {};
    const dataName = `${
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)
    }s`;
    //@ts-ignore
    data[dataName] = doc;
    //Send Response
    res.status(HttpStatusCode.ACCEPTED).json({
      status: 'success',
      results: doc.length,
      data,
    });
  });

export const getAllwithAuth = (model: Model<any>, popOptions?: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //To allow for nested Get bids on auction (hack)
    let filter = {};

    if (req.user) {
      filter = { user: req.user._id };
    } else {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }
    //Build The Query

    let query = model.find(filter);

    if (popOptions) query = query.populate(popOptions);

    const documentsLength = await query.clone().countDocuments();
    const nextPage = paginate(req, documentsLength);

    const features = new APIFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //Execute Query
    const doc = await features.query;

    const data = {};
    const dataName = `${
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)
    }s`;
    //@ts-ignore
    data[dataName] = doc;

    //Send Response
    res.status(HttpStatusCode.ACCEPTED).json({
      next: nextPage,
      status: 'success',
      results: doc.length,
      data,
    });
  });

export const createOneWithAuth = (model: Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let doc: any;
    if (req.user) {
      doc = await model.create({ ...req.body, user: req.user._id });
    } else {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }

    const data = {};
    const dataName =
      model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1);
    //@ts-ignore
    data[dataName] = doc;

    res.status(HttpStatusCode.CREATED).json({
      status: 'success',
      data,
    });
  });

export const createInterestedAuctionWithType = (
  type: INTERESTED_AUCTION_TYPE
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    console.log('entered');
    let auctionId;
    if (type === 300) {
      auctionId = req.body.auction;
    } else {
      auctionId = req.params.id;
    }
    const interestedAuction = await InterestedAuction.create({
      auction: auctionId,
      user: req.user?._id,
      type: type,
    });

    console.log(interestedAuction);
    next();
  });

export const getRecommendedAuctionsForThisAuction = async (
  auctionId: string
) => {
  const response = await fetch(`${AI_API_BASE_URL}${auctionId}`);
  const dataFromFlask = await response.json();
  const recommendedAuctionsIds = dataFromFlask.auctions.map(
    (el: string) => new mongoose.Types.ObjectId(el)
  );
  return recommendedAuctionsIds;
};

export const getRecommendedAuctionsForUser = async (
  recommendedAuctionsIds: string[]
) => {
  const recommendedAuctionsQuery = [
    { $match: { _id: { $in: recommendedAuctionsIds }, active: true } },
    {
      $addFields: {
        position: { $indexOfArray: [recommendedAuctionsIds, '$_id'] },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $sort: { position: 1 } },
    { $project: { position: 0 } },
  ];

  const recommendedAuctions = await Auction.aggregate(
    recommendedAuctionsQuery as any
  );
  return recommendedAuctions;
};

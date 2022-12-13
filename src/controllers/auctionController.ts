import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import multer from 'multer';
import sharp from 'sharp';
import Auction from '../models/auctionModel';
import catchAsync from '../utils/catchAsync';
import filterObj, { FilterObject } from '../utils/filterObject';
import * as factory from './handlerController';
import Bid from '../models/bidModel';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import {
  Categories,
  CategoriesArray,
  IMAGE_QUALITY,
  NUMBER_OF_AUCTION_IMAGES,
} from '../utils/constants/constants';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import strings from '../utils/constants/strings.json';
import User from '../models/userModel';
import paginate from '../utils/paginate';
import mongoose from 'mongoose';
import InterestedAuction from '../models/interestedAuctionModel';
import { getRecommendedAuctionsForThisAuction } from './handlerController';

const storageTemp = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/img/auctions');
  },
  filename: (req, file, cb) => {
    if (!file) {
      console.log('emptyssssssssssssssssssssssss');
    }
    console.log(file);
    cb(null, `auction-${Date.now()}-${file.originalname}`);
  },
});
export const uploadTemp = multer({ storage: storageTemp }).single('image');

const { errorMessages } = strings;
const multerStorage = multer.memoryStorage();
const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(errorMessages.image.required, HttpStatusCode.BAD_REQUEST),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadAuctionImages = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 4 },
]);

export const resizeAuctionImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //@ts-ignore
    if (!req.files?.thumbnail) return next();

    //Images

    // 1) Cover image
    req.body.thumbnail = `auction-${
      req.user?._id
    }-${Date.now()}-thumbnail.jpeg`;
    //@ts-ignore
    await sharp(req.files.thumbnail[0].buffer)
      //.resize(2000, 1333)

      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toFile(`./public/img/auctions/${req.body.thumbnail}`);
    //@ts-ignore
    if (req.files?.images) {
      req.body.images = [];
      await Promise.all(
        //@ts-ignore
        req.files.images.map(async (file: any, i: number) => {
          const filename = `auction-${req.user?._id}-${Date.now()}-${
            i + 1
          }.jpeg`;

          await sharp(file.buffer)
            //.resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: IMAGE_QUALITY })
            .toFile(`./public/img/auctions/${filename}`);
          req.body.images.push(filename);
        })
      );
    }
    next();
  }
);
// upload.fields([
//   { name: 'images', maxCount: 4 },
// ]);
export const getAllAuctions = factory.getAll(Auction);
export const getAllAuctionsTemp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //To allow for nested Get bids on auction (hack)
    let filter = {};
    if (req.params.auctionId) {
      filter = { auction: req.params.auctionId };
    }

    //Build The Query
    const features = new APIFeatures(
      Auction.find(filter).populate('user'),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //Execute Query
    const doc = await features.query;

    //Send Response
    res.status(HttpStatusCode.ACCEPTED).json({
      status: 'success',
      results: doc.length,
      data: { auctions: doc },
    });
  }
);

export const createAuction = factory.createOneWithAuth(Auction);
export const getAuctionTemp = factory.getOne(Auction, { path: 'user' });

export const getAuction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const auction = await Auction.findById({ _id: req.params.id }).populate(
      'user',
      'firstName lastName photo'
    );

    if (!auction) {
      return next(
        new AppError(errorMessages.auction.not_found, HttpStatusCode.NOT_FOUND)
      );
    }
    const bidsOnAuction = await Bid.find({ auction: auction._id })
      .sort('-price')
      // .select({
      //   user: 1,
      //   price: 1,
      // })
      .populate('user', 'firstName lastName photo');

    res.status(HttpStatusCode.ACCEPTED).json({
      status: 'success',
      data: { auction, bidsOnAuction },
    });
  }
);
export const updateAuctionTemp = factory.updateOne(Auction);
export const deleteAuction = factory.deleteOne(Auction);

export const updateAuction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //1) Create Error if user Posts password data
    // seller can modify only theses properties :title description images categoryID
    const filteredBody = filterObj(
      req.body,
      'images',
      'title',
      'description',
      'categoryID'
    );
    //3) Update user document
    const updatedAuction = await Auction.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      {
        new: true,
        runValdiators: true,
      }
    );

    res.status(HttpStatusCode.ACCEPTED).json({
      status: 'success',
      data: {
        auction: updatedAuction,
      },
    });
  }
);

export const getCreatedAuctions = catchAsync(
  async (req: Request, res: Response) => {
    let userId: string = req.user?._id;
    let seller: object | null = null;
    if (req.params.id) {
      userId = req.params.id;
      const sellerId = await User.findById(userId);
      seller = { user: sellerId };
    }

    let activeString = req.query?.active?.toString().trim().toLowerCase();
    let active: boolean | undefined;
    if (activeString === 'true') {
      active = true;
    } else if (activeString === 'false') {
      active = false;
    } else {
      active = undefined;
    }

    //Build The Query
    let filter: any = {};
    filter = { user: userId };

    if (active !== undefined) {
      filter.active = active;
    }
    console.log('filter', filter);
    const query = Auction.find(filter)
      .populate(seller === null ? 'user' : '')
      .sort('-startingDate _id');

    const documentsLength = await query.clone().countDocuments();
    const next = paginate(req, documentsLength);

    const features = new APIFeatures(query, req.query)
      //.filter()
      .sort()
      .limitFields()
      .paginate();
    const createdAuctions = await features.query;

    //Send Response
    res.status(HttpStatusCode.ACCEPTED).json({
      next: next,
      status: 'success',
      results: createdAuctions.length,
      data: { auctions: createdAuctions, ...seller },
    });
  }
);

export const getParticipatedAuctions = catchAsync(
  async (req: Request, res: Response) => {
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
    // console.log('page', page, 'limit', limit, 'skip', skip);
    //Build The Query
    const query = Bid.aggregate([
      {
        $match: { user: req.user!._id },
      },

      { $sort: { date: -1, _id: 1 } },
      {
        $group: {
          maxDate: { $max: '$date' },
          _id: '$auction',
          numberOfbids: { $sum: 1 },
          maxBid: { $max: '$price' },
          bidsOnAuction: {
            $push: '$$ROOT',
          },
        },
      },
      {
        // add an extra field called month
        $addFields: { auction: '$_id' },
      },
      {
        $lookup: {
          from: Auction.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'auction',
        },
      },
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
      // {
      //   $project: {
      //     id: '$auctions',
      //     total: 1,
      //     lineItems: 1,
      //   },
      // },
      { $sort: { maxDate: -1, _id: 1 } },

      // {
      //   $project: { _id: 0 },
      // },
    ]);
    if (active !== undefined) {
      query.append({ $match: { 'auction.active': active } });
    }

    const documentsLength = (await query).length;

    const participatedAuctions = await query.append(
      { $skip: skip },
      { $limit: limit }
    );
    let next = null;
    if (documentsLength > page * limit) {
      console.log((page + 1) * limit, documentsLength);
      next = documentsLength - page * limit;
    } else {
      next = null;
    }

    //Send Response
    res.status(HttpStatusCode.ACCEPTED).json({
      next: next,
      status: 'success',
      results: participatedAuctions.length,
      data: { auctions: participatedAuctions },
    });
  }
);

export const getSearchedAuctions = catchAsync(
  async (req: Request, res: Response) => {
    console.log('here');
    const { searchTerm, categoryID, priceMin, priceMax, active } = req.query;
    let searchTermFilter = {};
    const currentPrice: FilterObject = {};
    let categoryFilter = {};
    let priceFilter = {};
    let activeFilter = {};

    if (active) {
      switch (active) {
        case 'true':
          activeFilter = { active: true };
          break;
        case 'false':
          activeFilter = { active: false };
          break;
        default:
          activeFilter = {};
      }
    }

    if (searchTerm)
      searchTermFilter = { title: { $regex: `${searchTerm}`, $options: 'i' } };

    if (categoryID) {
      //@ts-ignore
      categoryFilter = { categoryID: categoryID };
    }

    if (priceMin) {
      currentPrice.$gte = Number(priceMin);
    }
    if (priceMax) {
      currentPrice.$lte = Number(priceMax);
    }

    if (!(Object.keys(currentPrice).length === 0)) {
      priceFilter = {
        currentPrice,
      };
    }

    if (Object.keys(currentPrice).length === 0) priceFilter = {};

    console.log('category ', categoryFilter);
    console.log('price filter', priceFilter);
    console.log('current price', currentPrice);

    let query = Auction.find({
      $and: [searchTermFilter, categoryFilter, priceFilter, activeFilter],
    }).populate('user', 'firstName lastName photo');

    const documentsLength = await query.clone().countDocuments();
    const next = paginate(req, documentsLength);
    //Send Response
    const features = new APIFeatures(query, req.query)
      // .filter()
      .sort()
      .paginate()
      .limitFields();

    const searchedAuctions = await features.query;

    res.status(201).json({
      next: next,
      status: 'success',
      results: searchedAuctions.length,
      data: { auctions: searchedAuctions },
    });
  }
);

export const getPredictedAuctions = catchAsync(
  async (req: Request, res: Response) => {
    const auctionId = req.params.id;
    const response = await fetch(
      `http://127.0.0.1:5000/predict-auctions/${auctionId}`
    );
    const dataFromFlask = await response.json();

    // console.log(data);

    const data = dataFromFlask.auctions.map(function (el: string) {
      return new mongoose.Types.ObjectId(el);
    });
    let query = [
      { $match: { _id: { $in: data }, active: true } },
      { $addFields: { position: { $indexOfArray: [data, '$_id'] } } },
      { $sort: { position: 1 } },
      { $project: { position: 0 } },
    ];

    const auctions = await Auction.aggregate(query as any);

    // const auctions = await Auction.find({ _id: { $in: dataFromFlask } });

    //Send Response
    res.status(HttpStatusCode.OK).json({
      status: 'success',
      results: auctions.length,
      data: { auctions: auctions },
    });
  }
);

export const recommendAuctions2 = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const interestedAuctions = await InterestedAuction.find({
    //   user: req.user?._id,
    // })
    //   .sort({ createdAt: -1 })
    //   .limit(4)
    //   .sort({ type: -1 });

    var interestedAuctions = await InterestedAuction.aggregate([
      { $match: { user: req.user?._id } },
      {
        $lookup: {
          from: Auction.collection.name,
          localField: 'auction',
          foreignField: '_id',
          as: 'auction',
        },
      },

      {
        $unwind: '$auction',
      },
      {
        $match: {
          'auction.active': true,
        },
      },

      { $sort: { createdAt: -1 } },
      { $limit: 4 },
      { $sort: { type: -1 } },
      { $project: { 'auction._id': 1 } },
    ]);
    console.log(interestedAuctions);

    res.status(HttpStatusCode.OK).json({
      status: 'success',
      results: interestedAuctions.length,
      data: { auctions: interestedAuctions },
    });
  }
);

export const recommendAuctions = catchAsync(
  async (req: Request, res: Response) => {
    const interestedAuctions = await InterestedAuction.aggregate([
      { $match: { user: req.user?._id } },
      {
        $lookup: {
          from: Auction.collection.name,
          localField: 'auction',
          foreignField: '_id',
          as: 'auction',
        },
      },

      {
        $unwind: '$auction',
      },
      {
        $match: {
          'auction.active': true,
        },
      },

      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      { $sort: { type: -1 } },
      { $project: { 'auction._id': 1 } },
    ]);
    console.log(interestedAuctions.length, 'interessssssssssssss');

    if (interestedAuctions.length < 5) {
      const query = Auction.find({ active: true })
        .sort({
          numberOfBids: -1,
          startingDate: -1,
        })
        .populate('user');
      const auctions = await query.limit(20);
      res.status(HttpStatusCode.OK).json({
        status: 'success',
        results: auctions.length,
        data: { auctions: auctions },
      });
    } else {
      const recommendedAuctionsIdsPromise = interestedAuctions.map((el: any) =>
        getRecommendedAuctionsForThisAuction(el.auction._id)
      );

      const recommendedAuctionsIds = await Promise.all(
        recommendedAuctionsIdsPromise
      );

      const recommendedAuctionsIdsArray: any[] = [];
      for (let i = 0; i < recommendedAuctionsIds.length; i++) {
        recommendedAuctionsIdsArray.push(...recommendedAuctionsIds[i]);
      }

      const recommendedAuctions = await factory.getRecommendedAuctionsForUser(
        recommendedAuctionsIdsArray
      );

      //Send Response
      res.status(HttpStatusCode.OK).json({
        status: 'success',
        results: recommendedAuctions.length,
        data: { auctions: recommendedAuctions },
      });
    }
  }
);

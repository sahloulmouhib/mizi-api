import express, {
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from 'express';
import multer from 'multer';
import sharp from 'sharp';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import filterObj from '../utils/filterObject';
import * as factory from './handlerController';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import { IMAGE_QUALITY, USER_PHOTO_SIZE } from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';
import Bid from '../models/bidModel';
import Auction from '../models/auctionModel';
import FavouriteAuction from '../models/favoriteAuctionsModel';

const { errorMessages } = strings;

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //users-ffgfgfgfgfg-333333.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user!.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();
const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user!.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(USER_PHOTO_SIZE[0], USER_PHOTO_SIZE[1])
      .toFormat('jpeg')
      .jpeg({ quality: IMAGE_QUALITY })
      .toFile(`./public/img/users/${req.file.filename}`);
    next();
  }
);

// export const createUser = (req: Request, res: Response) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not defined Please use sign up instead',
//   });
// };

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    console.log(req.file);
    //1) Create Error if user Posts password data
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError(errorMessages.auth.update_pass, HttpStatusCode.BAD_REQUEST)
      );

    //3) Filter fields that are not allowed to be updated
    const filteredBody = filterObj(
      req.body,
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'birthDate'
    );
    if (req.file) filteredBody.photo = req.file.filename;
    //3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(HttpStatusCode.CREATED).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  }
);

export const uploadUserPhoto = upload.single('photo');

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user?.id, { active: false });
    res.status(HttpStatusCode.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  }
);

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user?.id;
  next();
};
export const getUser = factory.getOne(User);
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);
export const getAllUsers = factory.getAll(User);

export const getUserInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user?.id;

    const bidsQuery = Bid.find({ user: user }).countDocuments();
    const createdAuctionsQuery = Auction.find({ user: user }).countDocuments();
    const favoritesAuctionsQuery = FavouriteAuction.find({
      user: user,
    }).countDocuments();

    const responses = await Promise.all([
      bidsQuery,
      createdAuctionsQuery,
      favoritesAuctionsQuery,
    ]);
    const numberOfBids = responses[0] || 0;
    const numberOfCreatedAuctions = responses[1] || 0;
    const numberOfFavorites = responses[2] || 0;

    res.status(HttpStatusCode.OK).json({
      status: 'success',
      results: 3,
      data: {
        userInfo: {
          numberOfBids,
          numberOfCreatedAuctions,
          numberOfFavorites,
        },
      },
    });
  }
);

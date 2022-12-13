import mongoose, { Schema, Types } from 'mongoose';
import AppError from '../utils/appError';
import Auction from './auctionModel';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import { BID_PERCENTAGE } from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';

const { errorMessages, validationMessage } = strings;
interface IBid {
  winner: boolean;
  price: number;
  date: Date | undefined;
  user: Types.ObjectId;
  auction: Types.ObjectId;
  calcNumberOfBids(auctionId: any): Promise<void>;
}
const bidSchema = new mongoose.Schema<IBid>({
  price: {
    type: Number,
    required: [true, validationMessage.bid.price.required],

    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },
  date: {
    type: Date,
    default: Date.now,
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.bid.user.required],
  },

  auction: {
    type: Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, validationMessage.bid.auction.required],
  },
  winner: {
    type: Boolean,
    default: false,
  },
});

//Static Fuctions
bidSchema.statics.calcNumberOfBids = async function (auctionId) {
  //this points to the model bid
  const stats = await this.aggregate([
    {
      $match: { auction: auctionId },
    },
    {
      $group: {
        _id: '$auction',
        numberOfBids: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Auction.findByIdAndUpdate(auctionId, {
      numberOfBids: stats[0].numberOfBids,
    });
  }
};

//Middlewares
//check if the price is higher than the current price

bidSchema.pre('save', async function (next) {
  if (this.isNew && this.auction) {
    const query = Auction.findById(this.auction);
    const auction = await query;

    if (!auction) {
      return next(
        new AppError(errorMessages.auction.not_found, HttpStatusCode.NOT_FOUND)
      );
    }
    if (!auction.active) {
      return next(
        new AppError(errorMessages.auction.inactive, HttpStatusCode.BAD_REQUEST)
      );
    }
    if (auction.currentPrice * BID_PERCENTAGE >= this.price) {
      return next(
        new AppError(errorMessages.bid.low, HttpStatusCode.BAD_REQUEST)
      );
    }
    let updatedAuctionDetails = {};
    if (auction.preferredPrice <= this.price) {
      updatedAuctionDetails = {
        currentPrice: this.price,
        winningBidder: this.user,
        closingDate: Date.now(),
        active: false,
      };
      await Auction.findByIdAndUpdate(auction._id, updatedAuctionDetails, {
        new: true,
        runValidators: false,
      });
      this.winner = true;
    } else {
      updatedAuctionDetails = { currentPrice: this.price };
      await Auction.findByIdAndUpdate(auction._id, updatedAuctionDetails, {
        new: true,
        runValidators: false,
      });
    }

    next();
  }
});

//this is a  document middleware
bidSchema.post('save', function () {
  //this points to current bid, this.constructor points to bid
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  this.constructor.calcNumberOfBids(this.auction);
});

//this is a query middleware that will trigger before any query that starts with findOne (findByIdAndUpdate and findByIdAndDelete)
bidSchema.pre(/^findOneAnd/, async function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  this.tempVar = await this.clone({
    new: true,
    runValidators: true,
  });
  next();
});

//this is a query middleware that will trigger after any query that starts with findOne
bidSchema.post(/^findOneAnd/, async function () {
  //in this case we don't have access to the document because the query has already been executed
  await this.tempVar.constructor.calcNumberOfBids(this.tempVar.auction);
});
const Bid = mongoose.model<IBid>('Bid', bidSchema);
export default Bid;

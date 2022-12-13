import mongoose, { Schema, Types } from 'mongoose';
import {
  AUCTION_DURATION,
  Categories,
  CATEGORIES_ID,
  VALIDATION_CONSTANTS,
} from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';

const { validationMessage } = strings;
export interface IAuction {
  _id: Types.ObjectId;
  title: string;
  description: string;
  user: Types.ObjectId;
  startingDate: Date | undefined;
  closingDate: Date | number | undefined;
  startingPrice: number;
  preferredPrice: number;
  currentPrice: number;
  closingPrice: number;
  numberOfBids: number;
  active: boolean;
  category: string;
  images: string[];
  thumbnail: string;
  winningBidder: Types.ObjectId;
  categoryID: number;
}

// seller can modify only theses properties :title description images category
const auctionSchema = new mongoose.Schema<IAuction>(
  {
    title: {
      type: String,
      required: [true, validationMessage.auction.title.required],
      minLength: [
        VALIDATION_CONSTANTS.AUCTION_TITLE.MIN,
        validationMessage.auction.title.minLength,
      ],
      maxLength: [
        VALIDATION_CONSTANTS.AUCTION_TITLE.MAX,
        validationMessage.auction.title.maxLength,
      ],
      // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
    },
    description: {
      type: String,
      required: [true, validationMessage.auction.description.required],
      minLength: [
        VALIDATION_CONSTANTS.AUCTION_DESCRIPTION.MIN,
        validationMessage.auction.description.minLength,
      ],
      maxLength: [
        VALIDATION_CONSTANTS.AUCTION_DESCRIPTION.MAX,
        validationMessage.auction.description.maxLength,
      ],
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, validationMessage.auction.user.required],
    },

    startingDate: {
      type: Date,
      required: [false, validationMessage.auction.startingDate.required],
      default: Date.now,
    },
    startingPrice: {
      type: Number,
      required: [true, validationMessage.auction.startingPrice.required],
    },
    preferredPrice: {
      type: Number,
      required: [false, validationMessage.auction.preferredPrice.required],
      validate: {
        validator: function (preferredPrice: number) {
          return preferredPrice > this.startingPrice;
        },
        message: validationMessage.auction.preferredPrice.message,
      },
    },
    closingPrice: {
      type: Number,
      required: [false, validationMessage.auction.closingPrice.required],
    },
    currentPrice: {
      type: Number,
      default: undefined,
    },
    closingDate: {
      type: Date,
      required: [true, validationMessage.auction.closingDate.required],
      default: Date.now() + AUCTION_DURATION,
      validate: {
        validator: function (closingDate: Date) {
          return closingDate > this.startingDate;
        },
        message: validationMessage.auction.closingDate.message,
      },
    },
    numberOfBids: {
      type: Number,
      default: VALIDATION_CONSTANTS.DEFAULT_NB_BIDS,
    },
    active: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: Categories,
      required: [false, validationMessage.auction.category.required],
    },
    images: {
      type: [String],
    },
    thumbnail: {
      type: String,
    },

    winningBidder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    categoryID: {
      type: Number,
      default: 300,
      //required: [true, validationMessage.auction.category.required],
      enum: CATEGORIES_ID,
    },
  },
  {
    toJSON: { virtuals: true },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    toObejct: { virtuals: true },
  }
);

//Middlewares
auctionSchema.pre('save', function (next) {
  if (this.isNew) {
    this.currentPrice = this.startingPrice;
    return next();
  }
  next();
});

// const mouhib = async function () {
//   //this refers to the document, this is only available with nml functions
//   try {
//     const query = Bid.find({ auction: this._id });
//     const bids = await query;
//     console.log(bids.length);
//     return bids.length;
//   } catch (err: Error) {
//     console.log(err);
//   }
// };
//Virtuals
// auctionSchema.virtual('numberOfBiders').get(async function () {
//   //this refers to the document, this is only available with nml functions
//   const query = Bid.find({ auction: this._id });
//   const bids = await query;
//   console.log(bids.length);
//   return bids.length;
// });

// //this is a query middleware that will trigger before any query taht starats with findOne
// auctionSchema.pre(/^findOneAnd/, async function (next) {
//   //@ts-ignore
//   this.tempVar = await this.findOne();
//   next();
// });

// //Query Middldlewares
// auctionSchema.post(/^find/, async function () {
//   const query = Bid.find({ auction: this._id });
//   const bids = await query;
//   console.log(bids.length);
//   this.tempVar.constructor.numberOfBidders = bids.length;
// });

const Auction = mongoose.model<IAuction>('Auction', auctionSchema);

export default Auction;

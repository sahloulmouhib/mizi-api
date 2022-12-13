import mongoose, { Schema, Types } from 'mongoose';
import User from './userModel';
import strings from '../utils/constants/strings.json';
import { VALIDATION_CONSTANTS } from '../utils/constants/constants';

const { validationMessage } = strings;

interface IRatedSeller {
  seller: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
}
const ratedSellerSchema = new mongoose.Schema<IRatedSeller>({
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.ratedSeller.seller.required],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.ratedSeller.user.required],
  },
  rating: {
    type: Number,
    min: [
      VALIDATION_CONSTANTS.USER_RATING.MIN,
      validationMessage.ratedSeller.rating.min,
    ],
    max: [
      VALIDATION_CONSTANTS.USER_RATING.MAX,
      validationMessage.ratedSeller.rating.max,
    ],
    required: [true, validationMessage.ratedSeller.rating.required],
  },
});

ratedSellerSchema.statics.calcAverageRatings = async function (sellerId) {
  //this points to the model ratedSeller
  const stats = await this.aggregate([
    {
      $match: { seller: sellerId },
    },
    {
      $group: {
        _id: '$seller',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await User.findByIdAndUpdate(sellerId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await User.findByIdAndUpdate(sellerId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

//indexes
ratedSellerSchema.index({ seller: 1, user: 1 }, { unique: true });

//this is a  document middleware
ratedSellerSchema.post('save', function () {
  //this points to current ratedSeller, this.constructor points to ratedSeller
  this.constructor.calcAverageRatings(this.seller);
});

//findByIdAndUpdate
//findByIdAndDelete
//this is a query middleware that will trigger before any query taht starats with findOne
ratedSellerSchema.pre(/^findOneAnd/, async function (next) {
  // console.log(this);
  this.rating = await this.clone({
    new: true,
    runValidators: true,
  });
  next();
});

//this is a query middleware that will trigger after any query that starts with findOne
ratedSellerSchema.post(/^findOneAnd/, async function () {
  //in this case we don't have access to the document because the query has already been executed
  await this.rating.constructor.calcAverageRatings(this.rating.seller);
});

const RatedSeller = mongoose.model<IRatedSeller>(
  'RatedSeller',
  ratedSellerSchema
);
export default RatedSeller;

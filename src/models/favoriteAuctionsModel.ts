import mongoose, { Schema, Types } from 'mongoose';
import strings from '../utils/constants/strings.json';

const { validationMessage } = strings;
interface IFavoriteAuction {
  user: Types.ObjectId;
  auction: Types.ObjectId;
  date: Date | undefined;
}
const favoriteAuctionSchema = new mongoose.Schema<IFavoriteAuction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.favoriteAuction.user.required],
  },

  auction: {
    type: Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, validationMessage.favoriteAuction.auction.required],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

favoriteAuctionSchema.index({ auction: 1, user: 1 }, { unique: true });

const FavouriteAuction = mongoose.model<IFavoriteAuction>(
  'FavouriteAuction',
  favoriteAuctionSchema
);

export default FavouriteAuction;

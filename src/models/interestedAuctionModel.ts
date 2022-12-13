import mongoose, { Schema, Types } from 'mongoose';
import {
  INTERESTED_AUCTION_TYPE,
  INTERESTED_AUCTION_TYPES,
} from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';

const { validationMessage } = strings;

export interface IInterestedAuction {
  user: Types.ObjectId;
  auction: Types.ObjectId;
  createdAt: Date;
  type: INTERESTED_AUCTION_TYPE;
}

const interestedAuctionSchema = new mongoose.Schema<IInterestedAuction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.interestedAuction.user.required],
  },

  auction: {
    type: Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, validationMessage.interestedAuction.auction.required],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: Number,
    enum: INTERESTED_AUCTION_TYPES,
    required: [true, validationMessage.interestedAuction.type.required],
  },
});

interestedAuctionSchema.index({ user: 1 });

const InterestedAuction = mongoose.model<IInterestedAuction>(
  'InterestedAuction',
  interestedAuctionSchema
);

export default InterestedAuction;

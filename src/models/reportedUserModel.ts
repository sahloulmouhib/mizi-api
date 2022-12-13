import mongoose, { Schema, Types } from 'mongoose';
import { VALIDATION_CONSTANTS } from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';

const { validationMessage } = strings;

interface IReportedUser {
  reporter: Types.ObjectId;
  reportedUser: Types.ObjectId;
  message: string;
  title: string;
  createdAt: Date;
}
const reportedUserSchema = new mongoose.Schema<IReportedUser>({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.reportedUser.reporter.required],
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, validationMessage.reportedUser.reportedUser.required],
  },
  message: {
    type: String,
    maxlength: [
      VALIDATION_CONSTANTS.REPORT.REASON.MAX,
      validationMessage.reportedUser.message.maxlength,
    ],
    minlength: [
      VALIDATION_CONSTANTS.REPORT.REASON.MIN,
      validationMessage.reportedUser.message.minlength,
    ],
    required: [true, validationMessage.reportedUser.message.required],
  },
  title: {
    type: String,
    required: [true, validationMessage.reportedUser.title.required],
    minLength: [
      VALIDATION_CONSTANTS.REPORT.TITLE.MIN,
      validationMessage.reportedUser.title.minLength,
    ],
    maxLength: [
      VALIDATION_CONSTANTS.REPORT.TITLE.MAX,
      validationMessage.reportedUser.title.maxLength,
    ],
    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const ReportedUser = mongoose.model<IReportedUser>(
  'ReportedUser',
  reportedUserSchema
);
export default ReportedUser;

import crypto from 'crypto';
import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import strings from '../utils/constants/strings.json';
import {
  PASSWORD_RESET_EXPIRED,
  SALT_ROUNDS_HASH,
  VALIDATION_CONSTANTS,
} from '../utils/constants/constants';

const { validationMessage } = strings;
interface IUser {
  firstName: string;
  lastName: string;
  birthDate: Date | number | undefined;
  phoneNumber: string;
  budgetRange: number[];
  keywords: string[];
  email: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt: Date | number;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | number | undefined;
  photo: string;
  role: string;
  active: boolean;
  ratingsQuantity: number;
  ratingsAverage: number;
  correctPassword(candidatePassword: any, userPassword: any): any;
  createPasswordResetToken(): string;
  changedPasswordAfter(JWTimestamp: any): boolean;
}

const userSchema = new mongoose.Schema<IUser>({
  firstName: {
    type: String,
    required: [true, validationMessage.user.firstName.required],
    maxLength: [
      VALIDATION_CONSTANTS.FIRST_NAME.MAX,
      validationMessage.user.firstName.maxLength,
    ],
    minLength: [
      VALIDATION_CONSTANTS.FIRST_NAME.MIN,
      validationMessage.user.firstName.minLength,
    ],
    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },
  lastName: {
    type: String,
    required: [true, validationMessage.user.lastName.required],
    maxLength: [
      VALIDATION_CONSTANTS.LAST_NAME.MAX,
      validationMessage.user.lastName.maxLength,
    ],
    minLength: [
      VALIDATION_CONSTANTS.LAST_NAME.MIN,
      validationMessage.user.lastName.minLength,
    ],
    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },
  birthDate: {
    type: Date,
    required: [true, validationMessage.user.birthDate.required],
    max: ['01-01-2004', validationMessage.user.birthDate.max],
    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },

  phoneNumber: {
    type: String,
    required: [true, validationMessage.user.phoneNumber.required],
    // validate: {
    //   validator: function (el: string) {
    //     return validator.isMobilePhone(el, ['ar-TN']);
    //   },
    //   message: validationMessage.user.phoneNumber.message,
    // },
  },
  keywords: {
    type: [String],
    // required: [false, validationMessage.user.keywords.required],
    // validate: {
    //   validator: function (el: string[]) {
    //     let test = true;
    //     for (let i = 0; i < el.length; i += 1) {
    //       el[i] = el[i].trim();
    //       if (!validator.isAlpha(el[i]) || el[i].length < 3) test = false;
    //     }
    //     return test;
    //   },
    //   message: validationMessage.user.keywords.message,
    // },
    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },
  budgetRange: {
    type: [Number],
    // required: [false, validationMessage.user.budgetRange.required],
    // validate: {
    //   validator: function (el: number[]) {
    //     return el.length === 2 && el[0] < el[1];
    //   },
    //   message: validationMessage.user.budgetRange.message,
    // },
    // validate: [validator.isAlpha, 'Tou name must only contain caracters'],
  },

  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, validationMessage.user.email.required],
    validate: [validator.isEmail, validationMessage.user.email.message],
  },
  password: {
    type: String,
    maxLength: [
      VALIDATION_CONSTANTS.PASSWORD.MAX,
      validationMessage.user.passwordConfirm.maxLength,
    ],
    minLength: [
      VALIDATION_CONSTANTS.PASSWORD.MIN,
      validationMessage.user.passwordConfirm.minLength,
    ],
    required: [true, validationMessage.user.passwordConfirm.required],
    select: false,
  },
  passwordConfirm: {
    type: String,
    maxLength: [
      VALIDATION_CONSTANTS.PASSWORD.MAX,
      validationMessage.user.passwordConfirm.maxLength,
    ],
    minength: [
      VALIDATION_CONSTANTS.PASSWORD.MIN,
      validationMessage.user.passwordConfirm.minLength,
    ],
    required: [true, validationMessage.user.passwordConfirm.required],
    validate: {
      validator: function (el: string) {
        //this only works on save and create
        return el === this.password;
      },
      message: validationMessage.user.passwordConfirm.message,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  photo: {
    type: String,
    default: 'default.png',
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  ratingsAverage: {
    type: Number,
    default: VALIDATION_CONSTANTS.USER_RATING.AVERAGE,
    min: [
      VALIDATION_CONSTANTS.USER_RATING.DEFAULT_MIN,
      validationMessage.user.ratingsAverage.min,
    ],
    max: [
      VALIDATION_CONSTANTS.USER_RATING.MAX,
      validationMessage.user.ratingsAverage.max,
    ],
    set: (val: number) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: VALIDATION_CONSTANTS.USER_RATING.QUANTITY,
  },
});

userSchema.pre('save', async function (next) {
  //Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //Hash the code with cost of 12
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS_HASH);
  //Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string | Buffer,
  userPassword: string
) {
  //this.password will not be available because we put select:false
  // eslint-disable-next-line @typescript-eslint/return-await
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      ((this.passwordChangedAt as Date).getTime() / 1000).toString(),
      10
    );

    return JWTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + PASSWORD_RESET_EXPIRED;
  return resetToken;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//show users only with an active account
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: true }).select(
    '-passwordChangedAt -passwordResetToken -passwordResetExpires'
  );
  next();
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;

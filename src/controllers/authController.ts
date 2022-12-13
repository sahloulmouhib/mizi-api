import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import { promisify } from 'util';
import crypto from 'crypto';

import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import sendEmail from '../utils/email';
import HttpStatusCode from '../utils/constants/httpSatusCodes';
import { JWT_EXPIRED } from '../utils/constants/constants';
import strings from '../utils/constants/strings.json';

const { errorMessages } = strings;
const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (
  user: any,
  statusCode: number,
  res: Response,
  req?: Request
) => {
  const token = signToken(user._id);
  const cookieOptions = {
    secure: false,
    expires: new Date(
      ((Date.now() + process.env.JWT_COOKIE_EXPIRES_IN!) as any) * JWT_EXPIRED
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req: Request, res: Response) => {
  const newUser = await User.create(req.body);

  createAndSendToken(newUser, 201, res);
});

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    console.log(email, password);
    //1) Check if email and password exist
    if (!email || !password) {
      return next(
        new AppError(errorMessages.auth.missing, HttpStatusCode.BAD_REQUEST)
      );
    }
    //2) Check is user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(
        new AppError(errorMessages.auth.incorrect, HttpStatusCode.UNAUTHORIZED)
      );
    }
    //3) If everything is ok, send token to client
    createAndSendToken(user, HttpStatusCode.ACCEPTED, res, req);
  }
);

//Middleware to pretect the route you need a token first
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('mouhibbbbbbbbbbbbbb');
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    console.log(token);
    if (!token) {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }
    // 2) Verification of the token (was manipualted or not )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment

    const decoded: JwtPayload = await promisify(jwt.verify)(
      token,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      process.env.JWT_SECRET
    );
    // 3) Check if users still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(errorMessages.token.expired, HttpStatusCode.UNAUTHORIZED)
      );
    }
    // 4) Check if user changed password after the token was issued
    console.log('state', currentUser.changedPasswordAfter(decoded.iat));
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          errorMessages.auth.password_changed,
          HttpStatusCode.UNAUTHORIZED
        )
      );
    }
    //Grant access to protected route
    req.user = currentUser;
    next();
  }
);

export const restrictTo =
  (...roles: any) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return next(
        new AppError(errorMessages.auth.forbidden, HttpStatusCode.FORBIDDEN)
      );
    }
    next();
  };

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError(errorMessages.auth.not_found, HttpStatusCode.NOT_FOUND)
      );
    }

    //2) Generate the random reset token
    try {
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      //3) Send it to user's email
      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token(valid for 10m)',
        message: `send new password to ${resetURL}`,
      });
      res.status(HttpStatusCode.ACCEPTED).json({
        status: 'success',
        message: 'token sent to email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError(errorMessages.auth.reset_mail));
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //1) Get user base on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //2) If token has not expired, and there is a user set the new password
    if (!user) {
      return next(
        new AppError(
          errorMessages.token.invalid_or_exppired,
          HttpStatusCode.BAD_REQUEST
        )
      );
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //3) Update changedPasswordAt property for the user
    createAndSendToken(user, HttpStatusCode.ACCEPTED, res);
    //4)  Log the user in , send JWT
  }
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user from collection
    const user = await User.findById(req.user!.id).select('+password');

    //2) check if posted password is correct
    if (
      !(await user!.correctPassword(req.body.passwordCurrent, user!.password))
    ) {
      return next(
        new AppError(
          errorMessages.auth.valid_password,
          HttpStatusCode.BAD_REQUEST
        )
      );
    }
    //3) if so , update password
    user!.password = req.body.password;
    user!.passwordConfirm = req.body.passwordConfirm;
    user!.passwordChangedAt = Date.now();
    await user!.save();
    // User.findByIdAnd Update will not work as intended

    //4) log user in , send jwt
    createAndSendToken(user, HttpStatusCode.ACCEPTED, res);
    //
  }
);
export const protectUserProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(req.url.split('/')[1]);
  const image = req.url.split('/')[1] as string;
  if (image !== req.user?.photo) {
    return next(
      new AppError(errorMessages.auth.forbidden, HttpStatusCode.FORBIDDEN)
    );
  }
  next();
};

export const getUserWithToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    console.log('heeere');
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new AppError(errorMessages.auth.required, HttpStatusCode.UNAUTHORIZED)
      );
    }
    // 2) Verification of the token (was manipualted or not )

    const decoded: JwtPayload = await promisify(jwt.verify)(
      token,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      process.env.JWT_SECRET
    );
    // 3) Check if users still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(errorMessages.token.expired, HttpStatusCode.UNAUTHORIZED)
      );
    }
    // 4) Check if user changed password after the token was issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          errorMessages.auth.password_changed,
          HttpStatusCode.UNAUTHORIZED
        )
      );
    }
    //Grant access to protected route
    res.status(HttpStatusCode.OK).json({
      status: 'success',
      data: {
        user: currentUser,
      },
    });
  }
);

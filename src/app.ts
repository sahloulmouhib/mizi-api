import express from 'express';

import fs from 'fs';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
//import hpp from 'hpp';
import swaggerUi = require('swagger-ui-express');

import path from 'path';
import globalErrorHandler from './controllers/errorController';
import auctionRouter from './routes/auctionRoutes';
import userRouter from './routes/userRoutes';
import bidRouter from './routes/bidRoutes';
import AppError from './utils/appError';
import HttpStatusCode from './utils/constants/httpSatusCodes';
import { LIMITER } from './utils/constants/constants';
import strings from './utils/constants/strings.json';
import * as authController from './controllers/authController';
import cron from 'node-cron';

import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();
const swaggerFile = './swagger.json';
const swaggerData = fs.readFileSync(swaggerFile, 'utf8');
const swaggerDocument = JSON.parse(swaggerData);

//1) Global Middlewares

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.

// cron.schedule('*/5 * * * * *', () => {
//   console.log('running a task every minute');
// });

app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//Set security HTTP headers
app.use(helmet());
// app.use(cors(), function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // update to match the domain you will make the request from
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept'
//   );
//   next();
// });
//Development logging
// if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//Body Parser function that will add the data from the body to the http request
app.use(express.json());
app.use(morgan('tiny'));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

//Data sanitizing
//app.use(xss());

// //Prevent parameter pollutions
// app.use(
//   hpp({
//     whitelist: ['duration', 'ratingQuantity', 'ratingsAverage', 'price'],
//   })
// );

//Limit request from the same Ip
// const limiter = rateLimit({
//   max: LIMITER.MAX,
//   windowMs: LIMITER.WINDOWS_MS,
//   message: strings.limiter,
// });

// app.use('/api', limiter);

// Serving static files
app.use(
  '/api/v1/auctions/img',
  express.static(path.join('public/img/auctions'))
);
app.use(
  '/api/v1/users/img',
  //authController.protect,
  //authController.protectUserProfile,
  express.static(path.join('public/img/users'))
);

//2) Routes

app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, undefined, undefined)
);
app.use('/api/v1/auctions', auctionRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bids', bidRouter);

app.all('*', (req, res, next) => {
  // if we pass an argument to next it knows that it is an error and with skip to the error handler middleware;
  next(
    new AppError(
      `Can't find this url  ${req.originalUrl} on this`,
      HttpStatusCode.NOT_FOUND
    )
  );
});

//ERROR HANDLING by specifying 4 parameters express knows that this fn is error handling middleware
app.use(globalErrorHandler);

export default app;

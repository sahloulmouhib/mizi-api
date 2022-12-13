import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import * as authController from '../controllers/authController';
import * as bidController from '../controllers/bidController';
import { createInterestedAuctionWithType } from '../controllers/handlerController';

const router = express.Router({ mergeParams: true });

//router.use(authController.protect);

// router.route('/test').get(bidController.getAllBids).post(
//   //authController.restrictTo('user'),
//   bidController.createBidTemp
// );

// router
//   .route('/test/:id')
//   .get(bidController.getBid)
//   .patch(
//     //authController.restrictTo('user', 'admin'),
//     bidController.updateBid
//   )
//   .delete(
//     //authController.restrictTo('user', 'admin'),s
//     bidController.deleteBid
//   );

//FIXME: enable this after fixing the issue with the auction id
router.route('/').get(authController.protect, bidController.getAllBids).post(
  authController.protect,
  createInterestedAuctionWithType(300),
  //authController.restrictTo('user'),
  bidController.createBid
);

router
  .route('/')
  .get(authController.protect, bidController.getAllBids)
  .post(authController.protect, bidController.createBid);

router
  .route('/:id')
  .get(bidController.getBid)
  .patch(
    //authController.restrictTo('user', 'admin'),
    bidController.updateBid
  )
  .delete(
    //authController.restrictTo('user', 'admin'),s
    bidController.deleteBid
  );

export default router;

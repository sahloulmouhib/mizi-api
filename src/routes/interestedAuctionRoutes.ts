import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import * as authController from '../controllers/authController';
import * as interestedAuctionController from '../controllers/interestedAuctionController';

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    interestedAuctionController.getAllUserInterestedAuctions
  )
  .post(
    authController.protect,

    interestedAuctionController.createInterestedAuction
  );

router
  .route('/:id')

  .get(
    authController.protect,
    interestedAuctionController.getAllInterestedAuctions
  )
  .patch(
    authController.protect,
    interestedAuctionController.updateInterestedAuction
  )
  .delete(
    authController.protect,
    interestedAuctionController.deleteInterestedAuction
  );

export default router;

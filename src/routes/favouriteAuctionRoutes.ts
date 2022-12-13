import express from 'express';
import * as authController from '../controllers/authController';
import * as favouriteAuctionController from '../controllers/favouriteAuctionController';
import { createInterestedAuctionWithType } from '../controllers/handlerController';

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    favouriteAuctionController.getAllUserFavouriteAuctions
  );

// get all users' favourite auctions
router.route('/admin').get(favouriteAuctionController.getAllFavouriteAuctions);
router
  .route('/:id')
  .get(favouriteAuctionController.getFavouriteAuction)
  //id of the auction
  //FIXME: enable this after fixing the issue with the auction id
  .post(
    authController.protect,
    createInterestedAuctionWithType(200),
    favouriteAuctionController.createFavouriteAuction
  )
  .patch(
    //authController.restrictTo('user', 'admin'),
    favouriteAuctionController.updateFavouriteAuction
  )
  //id of the favourite auction
  .delete(
    //authController.restrictTo('user', 'admin'),s
    authController.protect,
    favouriteAuctionController.deleteFavouriteAuction
  );

export default router;

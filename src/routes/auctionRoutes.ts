import express from 'express';
import * as auctionController from '../controllers/auctionController';
import favouriteAuctionRouter from './favouriteAuctionRoutes';
import interestedAuctionRouter from './interestedAuctionRoutes';
import * as authController from '../controllers/authController';

import bidRouter from './bidRoutes';
import { createInterestedAuctionWithType } from '../controllers/handlerController';

const router = express.Router();
// router param

router.use('/:auctionId/bids', bidRouter);

router.use('/favourite-auctions', favouriteAuctionRouter);
router.use('/interested-auctions', interestedAuctionRouter);
router.route('/search').get(auctionController.getSearchedAuctions);
router
  .route('/participated-auctions')
  .get(authController.protect, auctionController.getParticipatedAuctions);

router
  .route('/created-auctions')
  .get(authController.protect, auctionController.getCreatedAuctions);

router
  .route('/created-auctions/:id')
  .get(authController.protect, auctionController.getCreatedAuctions);

router
  .route('/predict-auctions/:id')
  .get(auctionController.getPredictedAuctions);

router

  .route('/recommend-auctions/')
  .get(authController.protect, auctionController.recommendAuctions);

router
  .route('/')
  .get(auctionController.getAllAuctionsTemp)
  .post(
    authController.protect,
    auctionController.uploadAuctionImages,
    auctionController.resizeAuctionImages,
    auctionController.createAuction
  );

router
  .route('/upload-images')
  .post(auctionController.uploadTemp, (req, res) => {
    res.send('image uplaoded');
  });
router
  .route('/:id')

  //FIXME: enable this after fixing the issue with the auction id
  .get(
    authController.protect,
    createInterestedAuctionWithType(100),
    auctionController.getAuction
  )
  .patch(
    authController.protect,

    auctionController.uploadAuctionImages,
    auctionController.resizeAuctionImages,
    auctionController.updateAuction
  )
  .delete(
    authController.protect,

    auctionController.deleteAuction
  );

export default router;

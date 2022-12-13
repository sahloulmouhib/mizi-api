import express from 'express';
import * as authController from '../controllers/authController';
import * as ratedSellerController from '../controllers/ratedSellerController';

const router = express.Router();

// get user's rated sellers
router
  .route('/')
  .get(authController.protect, ratedSellerController.getAllUserRatedSellers);

// get all users' rated sellers
router.route('/admin').get(ratedSellerController.getAllRatedSellers);
router
  .route('/:id')
  .post(authController.protect, ratedSellerController.rateSeller)
  .get(ratedSellerController.getRatedSeller)
  .patch(ratedSellerController.updateRatedSeller)
  .delete(authController.protect, ratedSellerController.deleteRatedSeller);

export default router;

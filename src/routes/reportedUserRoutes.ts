import express from 'express';
import * as authController from '../controllers/authController';
import * as reportedUserController from '../controllers/reportedUserController';

const router = express.Router();

// get user's favourite auctions
router
  .route('/')
  .get(authController.protect, reportedUserController.getAllReportedUsers);

router
  .route('/:id')
  .get(reportedUserController.getReportedUser)
  .post(authController.protect, reportedUserController.createReportedUser);

export default router;

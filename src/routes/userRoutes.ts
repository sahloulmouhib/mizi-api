import express from 'express';

import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import ratedSellerRouter from './ratedSellerRoutes';
import reportedUserRouter from './reportedUserRoutes';

const router = express.Router();
router.use('/reported-users', reportedUserRouter);
router.use('/rated-sellers', ratedSellerRouter);

router.post('/getUserWithToken', authController.getUserWithToken);
router.get('/getUserInfo', authController.protect, userController.getUserInfo);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// router.use(authController.protect);

router.patch(
  '/updateMypassword',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateMe',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

//Restrict to admin
//router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;

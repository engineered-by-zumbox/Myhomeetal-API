const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const authenticateUser = require('../middlewares/authenticateUsers');


//Public Routes
router.post('/sign-up', userController.signUp);
router.post('/sign-in', userController.signIn);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/product-categories', userController.getProductCategories);
router.get("/product-sub-categories", userController.getProductSubCategories);
router.get('/all-users', userController.fetchAllUsers);
router.post('/forgot-pass', userController.forgotPassword);
router.post('/reset-pass', userController.resetPassword);




//Private Routes
router.get('/saved-items', authenticateUser, userController.getSavedItems );
router.get('/cart', authenticateUser, userController.getItemsInCart)
router.get('/referrals', authenticateUser, userController.getUserReferrals);
router.put('/edit-profile', authenticateUser, userController.editAccountProfile);
router.put('/cart', authenticateUser, userController.decrementCartItem)
router.delete('/saved-item', authenticateUser, userController.removeSavedItem);
router.delete('/cart', authenticateUser, userController.removeItemFromCart);
router.delete('/delete-account', authenticateUser, userController.deleteAccount);
router.get('/:id',authenticateUser, userController.viewAccountProfile);
router.post('/save-item/:id', authenticateUser, userController.addSavedItem);
router.post('/cart/:id', authenticateUser, userController.addItemToCart);









module.exports = router
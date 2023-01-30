const express = require('express');
const viewControllers = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

// rendering the webpage



router.get('/',authController.isLoggedIn,viewControllers.getOverview);
router.get('/tour/:slug',authController.isLoggedIn,viewControllers.getTour);
router.get('/login',authController.isLoggedIn,viewControllers.getLoginForm);
router.get('/me',authController.protect, viewControllers.getAccount);

// router.post('/submit-user-data',authController.protect,viewControllers.updateUserData);

module.exports = router;